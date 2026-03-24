import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(req: Request) {
  console.log("[Checkout/Create] ▶ Iniciando creación de orden");
  try {
    const body = await req.json();
    const { productId, buyerId, email, quantity, discountCode, planId } = body;

    console.log("[Checkout/Create] Datos recibidos:", {
      productId,
      buyerId: buyerId ?? "(no buyerId, usando email)",
      email: email ?? "(no email)",
      quantity,
      discountCode: discountCode ?? "(sin descuento)",
      planId: planId ?? "(sin planId)",
    });

    if (!productId || (!buyerId && !email)) {
      console.error("[Checkout/Create] ❌ Faltan campos requeridos");
      return NextResponse.json({ error: "productId and (buyerId or email) are required" }, { status: 400 });
    }

    // 1. Crear la orden en Supabase
    console.log("[Checkout/Create] Creando orden en Supabase...");
    const order = await OrderService.createOrder(buyerId || null, productId, quantity || 1, discountCode, email, planId);
    console.log("[Checkout/Create] ✅ Orden creada:", {
      orderId: order.id,
      finalAmount: order.finalAmount,
      status: order.status,
    });

    // 2. Generar firma de integridad para Wompi
    const amountInCents = Math.round(order.finalAmount * 100);
    const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!integritySecret) {
      console.error("[Checkout/Create] WOMPI_INTEGRITY_SECRET no configurado");
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
    }

    if (!wompiPublicKey) {
      console.error("[Checkout/Create] WOMPI_PUBLIC_KEY no configurado");
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
    }

    const integritySignature = PaymentService.generateIntegritySignature(
      order.id,
      amountInCents,
      "COP",
      integritySecret
    );

    console.log("[Checkout/Create] ✅ Respuesta lista para el cliente");
    return NextResponse.json({
      orderId: order.id,
      amountInCents,
      publicKey: wompiPublicKey,
      signature: integritySignature,
    });
  } catch (error: any) {
    console.error("[Checkout/Create] ❌ Error:", error?.message, error?.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
