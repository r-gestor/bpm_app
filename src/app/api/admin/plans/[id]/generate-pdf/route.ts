import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { AiPlanService } from "@/lib/services/ai-plan.service";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Verificar que el plan pertenece al usuario (o es admin)
    if (role !== "ADMIN") {
      const { data: plan } = await supabase
        .from("sanitation_plans")
        .select("id, ownerId")
        .eq("id", id)
        .maybeSingle();

      if (!plan || plan.ownerId !== userId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    console.log("[GeneratePdf] Generando PDF para plan:", id, "solicitado por:", userId);

    const result = await AiPlanService.generatePdf(id);

    if (result.success) {
      console.log("[Admin] ✅ PDF generado correctamente:", result.pdfUrl);
      return NextResponse.json({ success: true, pdfUrl: result.pdfUrl });
    } else {
      console.error("[Admin] ❌ Error generando PDF:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Admin] ❌ Error inesperado:", error?.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
