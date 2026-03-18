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

  console.log("[API Verify] Requesting status for:", { transactionId: id, planId });

  try {
    const baseUrl =
      process.env.WOMPI_BASE_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1");

    console.log("[API Verify] Using Wompi base URL:", baseUrl);

    const response = await fetch(`${baseUrl}/transactions/${id}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("[API Verify] Wompi returned non-OK:", response.status);
      // Devolver PENDING para que el cliente siga reintentando
      return NextResponse.json({ status: "PENDING" });
    }

    const result = await response.json();

    if (!result.data) {
      console.error("[API Verify] No data in Wompi response:", result);
      return NextResponse.json({ status: "PENDING" });
    }

    const transaction = result.data;
    console.log("[API Verify] Transaction status from Wompi:", transaction.status);

    // Actualizar DB si llegó a estado final — sin bloquear la respuesta al cliente
    if (FINAL_STATUSES.includes(transaction.status)) {
      OrderService.updateOrderStatus(
        transaction.reference,
        transaction.status,
        transaction.id,
        planId || undefined
      ).catch((err) =>
        console.error("[API Verify] DB update failed (webhook will retry):", err)
      );
    }

    return NextResponse.json({
      status: transaction.status,
      reference: transaction.reference,
    });
  } catch (error: any) {
    console.error("[API Verify] Unexpected error:", error);
    // Devolver PENDING en lugar de 500 para que el cliente siga reintentando
    return NextResponse.json({ status: "PENDING" });
  }
}
