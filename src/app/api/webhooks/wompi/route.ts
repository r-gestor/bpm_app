import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  console.log("[Webhook/Wompi] ▶ Webhook recibido");
  try {
    const body = await req.json();
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

    console.log("[Webhook/Wompi] Evento:", body?.event);
    console.log("[Webhook/Wompi] Transacción:", JSON.stringify({
      id: body?.data?.transaction?.id,
      reference: body?.data?.transaction?.reference,
      status: body?.data?.transaction?.status,
      amount: body?.data?.transaction?.amount_in_cents,
    }));
    console.log("[Webhook/Wompi] eventsSecret presente:", !!eventsSecret);

    // 1. Validar firma — Wompi envía el checksum en el body (payload.signature.checksum)
    if (eventsSecret) {
      const isValid = PaymentService.validateWebhookSignature(body, eventsSecret);
      console.log("[Webhook/Wompi] Validación de firma:", isValid ? "✅ válida" : "❌ inválida");
      if (!isValid) {
        console.error("[Webhook/Wompi] ❌ Firma inválida — rechazando webhook");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[Webhook/Wompi] ⚠️ WOMPI_EVENTS_SECRET no está configurado — saltando validación");
    }

    // 2. Procesar la actualización de la transacción
    console.log("[Webhook/Wompi] Procesando webhook...");
    await PaymentService.processWompiWebhook(body);
    console.log("[Webhook/Wompi] ✅ Webhook procesado correctamente");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook/Wompi] ❌ Error:", error?.message, error?.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
