import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id"); // Wompi Transaction ID
  const planId = searchParams.get("planId");

  if (!id) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  }

  console.log("[API Verify] Requesting status for:", { transactionId: id, planId });

  try {
    const wompiKey = process.env.WOMPI_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const isProd = wompiKey?.startsWith("pub_prod_");
    const baseUrl = isProd ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";
    
    const response = await fetch(`${baseUrl}/transactions/${id}`);
    const result = await response.json();
    
    if (result.error) {
       return NextResponse.json({ error: result.error.reason }, { status: 400 });
    }

    const transaction = result.data;

    // Optional: Synchronize status with backend if we reach a final state
    // Webhooks might overlap, but this guarantees immediate resolution for the user.
    if (["APPROVED", "DECLINED", "ERROR", "VOIDED"].includes(transaction.status)) {
       await OrderService.updateOrderStatus(transaction.reference, transaction.status, transaction.id, planId || undefined);
    }

    return NextResponse.json({ 
       status: transaction.status, 
       reference: transaction.reference 
    });
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
