import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const xWompiSignature = req.headers.get("x-wompi-signature");
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

    // 1. Validar firma si el secreto existe (Seguridad)
    if (eventsSecret && xWompiSignature) {
      const isValid = PaymentService.validateWebhookSignature(body, xWompiSignature, eventsSecret);
      if (!isValid) {
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
