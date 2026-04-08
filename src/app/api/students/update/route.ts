import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { StudentService } from "@/lib/services/student.service";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, documentType, documentNumber, password } = body;

    if (!id || !name || !documentType || !documentNumber) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Security: Ensure the student belongs to this buyer
    const { data: student } = await (await import("@/lib/supabase")).supabase
      .from("users")
      .select("registeredBy")
      .eq("id", id)
      .single();

    if (!student || student.registeredBy !== (session.user as any).id) {
      return NextResponse.json({ error: "No tienes permiso para editar este estudiante" }, { status: 403 });
    }

    await StudentService.updateStudent(id, { name, documentType, documentNumber });

    if (password) {
      await StudentService.updateStudentPassword(id, password);
    }

    return NextResponse.json({ message: "Estudiante actualizado exitosamente" });
  } catch (error: any) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
