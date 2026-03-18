import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";

const FINAL_STATUSES = ["APPROVED", "DECLINED", "ERROR", "VOIDED"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id"); // Wompi Transaction ID
  const planId = searchParams.get("planId");

  if (!id) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  }

  console.log("[Verify] ▶ Verificando transacción Wompi:", { transactionId: id, planId });

  try {
    const baseUrl =
      process.env.WOMPI_BASE_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1");

    console.log("[Verify] NODE_ENV:", process.env.NODE_ENV, "→ URL Wompi:", baseUrl);

    const response = await fetch(`${baseUrl}/transactions/${id}`, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("[Verify] Respuesta HTTP de Wompi:", response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Verify] ❌ Wompi respondió con error:", response.status, errorBody);
      return NextResponse.json({ status: "PENDING" });
    }

    const result = await response.json();
    console.log("[Verify] Respuesta Wompi (data):", JSON.stringify(result?.data ?? result));

    if (!result.data) {
      console.error("[Verify] ❌ Sin campo 'data' en respuesta Wompi:", result);
      return NextResponse.json({ status: "PENDING" });
    }

    const transaction = result.data;
    console.log("[Verify] Estado de la transacción:", {
      wompiId: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      amountInCents: transaction.amount_in_cents,
    });

    // Actualizar DB si llegó a estado final — fire-and-forget, no bloquea la respuesta
    if (FINAL_STATUSES.includes(transaction.status)) {
      console.log("[Verify] Estado final detectado, actualizando DB en background...");
      OrderService.updateOrderStatus(
        transaction.reference,
        transaction.status,
        transaction.id,
        planId || undefined
      )
        .then(() => console.log("[Verify] ✅ DB actualizada correctamente para:", transaction.reference))
        .catch((err) => console.error("[Verify] ❌ Error actualizando DB:", err?.message, err?.stack));
    }

    return NextResponse.json({
      status: transaction.status,
      reference: transaction.reference,
    });
  } catch (error: any) {
    console.error("[Verify] ❌ Error inesperado:", error?.message, error?.stack);
    return NextResponse.json({ status: "PENDING" });
  }
}
