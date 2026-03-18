import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Obtener el plan
    const { data: plan, error } = await supabase
      .from("sanitation_plans")
      .select("content")
      .eq("id", id)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const logoUrl = plan.content?.rawAnswers?.logoUrl;
    if (!logoUrl || !logoUrl.startsWith("data:")) {
      return NextResponse.json({ message: "El logo ya es una URL o no existe, no requiere migración." });
    }

    // 2. Extraer datos del base64
    const match = logoUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Formato base64 inválido" }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.split("/")[1] || "png";
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `logos/migrated/${id}.${ext}`;

    // 3. Subir a Storage
    const { error: uploadError } = await supabase.storage
      .from("sanitation-assets")
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Error subiendo: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("sanitation-assets")
      .getPublicUrl(fileName);

    // 4. Actualizar content con la URL en lugar del base64
    const updatedContent = {
      ...plan.content,
      rawAnswers: {
        ...plan.content.rawAnswers,
        logoUrl: publicUrlData.publicUrl,
      },
    };

    const { error: updateError } = await supabase
      .from("sanitation_plans")
      .update({ content: updatedContent })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: `Error actualizando plan: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Logo migrado de base64 a Storage",
      logoUrl: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
