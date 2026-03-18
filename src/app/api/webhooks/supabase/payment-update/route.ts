import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";

export async function POST(req: Request) {
  try {
    // Supabase Webhook secret check (Optional but recommended)
    // const authHeader = req.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const payload = await req.json();
    console.log("[Supabase Webhook] Payload recibido:", JSON.stringify(payload, null, 2));

    const { record, old_record, type, table, schema } = payload;

    // Solo procesar actualizaciones en la tabla de pagos
    if (table !== 'payments' || type !== 'UPDATE') {
      return NextResponse.json({ message: "Ignored event type or table" });
    }

    // Verificar si el estado cambió a APPROVED
    if (record.status === 'APPROVED' && old_record.status !== 'APPROVED') {
      console.log(`[Supabase Webhook] Detectado cambio a APPROVED para orden ${record.id}. Activando flujo...`);
      
      // Llamar a la lógica de actualización de orden
      // Nota: No pasamos transactionId porque es una aprobación manual
      await OrderService.updateOrderStatus(record.id, 'APPROVED');
      
      return NextResponse.json({ message: "Order processed successfully" });
    }

    return NextResponse.json({ message: "No action required (status not changed to APPROVED)" });
  } catch (error: any) {
    console.error("[Supabase Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
