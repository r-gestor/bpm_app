import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = (session.user as any).id;

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, documentType, documentNumber")
      .eq("id", userId)
      .single();

    if (error || !user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Verificar si ya tiene certificado emitido
    const { count: certCount } = await supabase
      .from("certificates")
      .select("id, enrollments!inner(studentId)", { count: "exact", head: true })
      .eq("enrollments.studentId", userId);

    return NextResponse.json({ ...user, hasCertificate: (certCount || 0) > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = (session.user as any).id;

    // Verificar si ya tiene certificado — si tiene, no puede editar
    const { count: certCount } = await supabase
      .from("certificates")
      .select("id, enrollments!inner(studentId)", { count: "exact", head: true })
      .eq("enrollments.studentId", userId);

    if ((certCount || 0) > 0) {
      return NextResponse.json(
        { error: "No puedes modificar tus datos porque ya tienes un Certificado de Manipulación de Alimentos emitido." },
        { status: 403 }
      );
    }

    const { name, documentType, documentNumber } = await req.json();

    if (!name || !documentType || !documentNumber) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({ name, documentType, documentNumber, updatedAt: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ message: "Datos actualizados exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
