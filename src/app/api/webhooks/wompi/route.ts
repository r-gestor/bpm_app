import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  const receivedAt = new Date().toISOString();
  let rawBody: any;

  try {
    rawBody = await req.json();
  } catch {
    console.error("[Webhook/Wompi] Body inválido — no es JSON");
    // Responder 200 para que Wompi no reintente con un payload corrupto
    return NextResponse.json({ received: true });
  }

  const transactionId = rawBody?.data?.transaction?.id ?? "unknown";
  const reference = rawBody?.data?.transaction?.reference ?? "unknown";
  const status = rawBody?.data?.transaction?.status ?? "unknown";
  const event = rawBody?.event ?? "unknown";

  console.log("[Webhook/Wompi] Evento recibido:", { event, transactionId, reference, status, receivedAt });

  // 1. Validar firma — OBLIGATORIA en producción
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

  if (!eventsSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Webhook/Wompi] WOMPI_EVENTS_SECRET no configurado en producción — rechazando");
      return NextResponse.json({ received: true }, { status: 401 });
    }
    console.warn("[Webhook/Wompi] WOMPI_EVENTS_SECRET no configurado — saltando validación (solo desarrollo)");
  } else {
    const isValid = PaymentService.validateWebhookSignature(rawBody, eventsSecret);
    if (!isValid) {
      console.error("[Webhook/Wompi] Firma inválida — rechazando", { transactionId, reference });
      await PaymentService.logWebhookEvent({
        transactionId,
        reference,
        event,
        status,
        receivedAt,
        signatureValid: false,
        processed: false,
        error: "Invalid signature",
      });
      return NextResponse.json({ received: true }, { status: 401 });
    }
  }

  // 2. Responder 200 inmediatamente es el ideal, pero en Next.js el body se envía al final.
  //    Lo que sí hacemos es SIEMPRE retornar 200 aunque falle el procesamiento interno,
  //    para evitar que Wompi reintente un evento que ya recibimos.
  try {
    const result = await PaymentService.processWompiWebhook(rawBody);

    await PaymentService.logWebhookEvent({
      transactionId,
      reference,
      event,
      status,
      receivedAt,
      signatureValid: true,
      processed: true,
      result: result ?? "skipped (not transaction.updated or already processed)",
    });

    console.log("[Webhook/Wompi] Procesado correctamente:", { transactionId, reference, status });
  } catch (error: any) {
    console.error("[Webhook/Wompi] Error procesando (respondemos 200 igual):", error?.message);

    await PaymentService.logWebhookEvent({
      transactionId,
      reference,
      event,
      status,
      receivedAt,
      signatureValid: true,
      processed: false,
      error: error?.message ?? "Unknown error",
    }).catch((logErr) => console.error("[Webhook/Wompi] Error guardando log:", logErr?.message));
  }

  // SIEMPRE 200 — si la firma fue válida, no queremos que Wompi reintente
  return NextResponse.json({ received: true });
}
