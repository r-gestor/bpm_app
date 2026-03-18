import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  try {
    const { productId, buyerId, email, quantity, discountCode, planId } = await req.json();

    if (!productId || (!buyerId && !email)) {
      return NextResponse.json({ error: "productId and (buyerId or email) are required" }, { status: 400 });
    }

    // 1. Crear la orden en Supabase
    const order = await OrderService.createOrder(buyerId || null, productId, quantity || 1, discountCode, email, planId);

    // 2. Generar firma de integridad para Wompi
    const amountInCents = Math.round(order.finalAmount * 100);
    const integritySignature = PaymentService.generateIntegritySignature(
      order.id,
      amountInCents,
      "COP",
      process.env.WOMPI_INTEGRITY_SECRET!
    );

    return NextResponse.json({
      orderId: order.id,
      amountInCents,
      publicKey: process.env.WOMPI_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      signature: integritySignature,
    });
  } catch (error: any) {
    console.error("Checkout creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
