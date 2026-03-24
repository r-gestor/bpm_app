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

  console.log("[Verify] Verificando transacción Wompi:", { transactionId: id, planId });

  try {
    const baseUrl =
      process.env.WOMPI_BASE_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1");

    const response = await fetch(`${baseUrl}/transactions/${id}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("[Verify] Wompi respondió con error:", response.status);
      return NextResponse.json({ status: "PENDING" });
    }

    const result = await response.json();

    if (!result.data) {
      return NextResponse.json({ status: "PENDING" });
    }

    const transaction = result.data;
    console.log("[Verify] Estado:", { reference: transaction.reference, status: transaction.status });

    // Actualizar DB si llegó a estado final.
    // Esto es un respaldo al webhook — el webhook es la fuente autoritativa,
    // pero el polling del cliente también dispara actualización por si el webhook
    // se retrasa o falla. La idempotencia en OrderService evita doble procesamiento.
    if (FINAL_STATUSES.includes(transaction.status)) {
      OrderService.updateOrderStatus(
        transaction.reference,
        transaction.status,
        transaction.id,
        planId || undefined
      ).catch((err) => console.error("[Verify] Error actualizando DB:", err?.message));
    }

    return NextResponse.json({
      status: transaction.status,
      reference: transaction.reference,
    });
  } catch (error: any) {
    console.error("[Verify] Error inesperado:", error?.message);
    return NextResponse.json({ status: "PENDING" });
  }
}
