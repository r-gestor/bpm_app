import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { OrderService } from "./order.service";

interface WebhookLogEntry {
  transactionId: string;
  reference: string;
  event: string;
  status: string;
  receivedAt: string;
  signatureValid: boolean;
  processed: boolean;
  result?: any;
  error?: string;
}

export class PaymentService {
  static generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integritySecret: string
  ): string {
    if (!integritySecret) {
      throw new Error("WOMPI_INTEGRITY_SECRET is not configured");
    }
    const stringToSign = `${reference}${amountInCents}${currency}${integritySecret}`;
    return crypto.createHash("sha256").update(stringToSign).digest("hex");
  }

  /**
   * Valida la firma del webhook de Wompi.
   * Wompi envía la firma en el BODY (payload.signature.checksum), NO en headers.
   * El checksum se calcula con las propiedades dinámicas en payload.signature.properties.
   * Docs: https://docs.wompi.co/docs/colombia/eventos/
   */
  static validateWebhookSignature(payload: any, eventsSecret: string): boolean {
    try {
      const { timestamp, signature } = payload;

      if (!signature?.properties || !signature?.checksum) {
        console.error("[Webhook] Missing signature.properties or signature.checksum in payload");
        return false;
      }

      // Obtener el valor de cada propiedad dinámica usando dot-notation.
      // Wompi envía properties como "transaction.id" que son relativas a payload.data
      const values = signature.properties.map((prop: string) => {
        const parts = prop.split(".");
        let val: any = payload.data;
        for (const part of parts) {
          val = val?.[part];
        }
        return val ?? "";
      });

      // Wompi: SHA256(prop1 + prop2 + ... + timestamp + eventsSecret)
      const concatenated = values.join("") + timestamp + eventsSecret;
      const hash = crypto.createHash("sha256").update(concatenated).digest("hex");

      console.log("[Webhook] Signature debug:", {
        properties: signature.properties,
        resolvedValues: values,
        timestamp,
        eventsSecretLength: eventsSecret.length,
        eventsSecretPrefix: eventsSecret.substring(0, 6) + "...",
        concatenatedPreview: concatenated.substring(0, 80) + "...",
        computedHash: hash,
        expectedChecksum: signature.checksum,
        match: hash === signature.checksum,
      });

      // Comparación en tiempo constante para evitar timing attacks
      const hashBuffer = Buffer.from(hash, "hex");
      const checksumBuffer = Buffer.from(signature.checksum, "hex");

      if (hashBuffer.length !== checksumBuffer.length) {
        console.error("[Webhook] Hash length mismatch:", hashBuffer.length, "vs", checksumBuffer.length);
        return false;
      }

      return crypto.timingSafeEqual(hashBuffer, checksumBuffer);
    } catch (err) {
      console.error("[Webhook] Error validating signature:", err);
      return false;
    }
  }

  /**
   * Procesa un webhook de Wompi con control de idempotencia.
   * Retorna null si el evento fue ignorado (ya procesado o evento no relevante).
   */
  static async processWompiWebhook(payload: any): Promise<{ orderId: string; status: string } | null> {
    const { data, event } = payload;

    if (event !== "transaction.updated") return null;

    const transaction = data.transaction;
    const orderId = transaction.reference;
    const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR
    const wompiTransactionId = transaction.id;

    // Idempotencia: verificar si este pago ya tiene el mismo estado y transactionId
    const { data: existingOrder } = await supabase
      .from("payments")
      .select("id, status, transactionId")
      .eq("id", orderId)
      .maybeSingle();

    if (!existingOrder) {
      console.warn("[Webhook] Orden no encontrada:", orderId);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Si ya está en el mismo estado con el mismo transactionId, es un duplicado
    if (existingOrder.status === status && existingOrder.transactionId === wompiTransactionId) {
      console.log("[Webhook] Evento duplicado — ya procesado:", { orderId, status });
      return null;
    }

    // No permitir regresiones de estado (APPROVED no puede volver a PENDING, etc.)
    const FINAL_STATUSES = ["APPROVED", "DECLINED", "VOIDED", "ERROR"];
    if (FINAL_STATUSES.includes(existingOrder.status) && existingOrder.status !== status) {
      console.warn("[Webhook] Intento de cambiar estado final:", {
        orderId,
        currentStatus: existingOrder.status,
        newStatus: status,
      });
      return null;
    }

    console.log("[Webhook] Processing transaction:", { orderId, status, transactionId: wompiTransactionId });

    await OrderService.updateOrderStatus(orderId, status, wompiTransactionId);

    return { orderId, status };
  }

  /**
   * Registra un evento de webhook en la tabla webhook_logs para auditoría.
   * Si la tabla no existe, hace fallback a console.log.
   */
  static async logWebhookEvent(entry: WebhookLogEntry): Promise<void> {
    try {
      const { error } = await supabase.from("webhook_logs").insert({
        transactionId: entry.transactionId,
        reference: entry.reference,
        event: entry.event,
        status: entry.status,
        receivedAt: entry.receivedAt,
        signatureValid: entry.signatureValid,
        processed: entry.processed,
        result: entry.result ? JSON.stringify(entry.result) : null,
        error: entry.error ?? null,
      });

      if (error) {
        // Si la tabla no existe, solo logueamos a consola (no es un error crítico)
        console.warn("[Webhook/Log] No se pudo guardar en webhook_logs (tabla puede no existir):", error.message);
        console.log("[Webhook/Log] Audit entry:", JSON.stringify(entry));
      }
    } catch (err: any) {
      console.warn("[Webhook/Log] Fallback a console:", err?.message);
      console.log("[Webhook/Log] Audit entry:", JSON.stringify(entry));
    }
  }
}
