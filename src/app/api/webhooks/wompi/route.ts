import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

    // 1. Validar firma — Wompi envía el checksum en el body (payload.signature.checksum)
    if (eventsSecret) {
      const isValid = PaymentService.validateWebhookSignature(body, eventsSecret);
      if (!isValid) {
        console.error("[Webhook] Invalid signature from Wompi");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 2. Procesar la actualización de la transacción
    await PaymentService.processWompiWebhook(body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
