import crypto from "crypto";

export class PaymentService {
  static generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integritySecret: string
  ): string {
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

      // Obtener el valor de cada propiedad dinámica usando dot-notation (e.g. "transaction.id")
      const values = signature.properties.map((prop: string) => {
        const parts = prop.split(".");
        let val: any = payload;
        for (const part of parts) {
          val = val?.[part];
        }
        return val ?? "";
      });

      // SHA256(prop1 + prop2 + ... + timestamp + eventsSecret)
      const stringToSign = values.join("") + timestamp + eventsSecret;
      const hash = crypto.createHash("sha256").update(stringToSign).digest("hex");

      return hash === signature.checksum;
    } catch (err) {
      console.error("[Webhook] Error validating signature:", err);
      return false;
    }
  }

  static async processWompiWebhook(payload: any) {
    const { data, event } = payload;

    if (event !== "transaction.updated") return;

    const transaction = data.transaction;
    const orderId = transaction.reference;
    const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    console.log("[Webhook] Processing transaction:", { orderId, status, transactionId: transaction.id });

    const { OrderService } = require("./order.service");
    await OrderService.updateOrderStatus(orderId, status, transaction.id);

    return { orderId, status };
  }
}
