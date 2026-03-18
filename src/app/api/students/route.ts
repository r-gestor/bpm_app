import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { StudentService } from "@/lib/services/student.service";
import { EmailService } from "@/lib/services/email.service";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Sync role to avoid stale session issues
    await StudentService.syncUserRole(userId);

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (dbUser?.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, documentType, documentNumber } = body;

    if (!name || !email || !documentType || !documentNumber) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Check quota before registering
    const buyerId = (session.user as any).id;
    const quota = await StudentService.getQuotaInfo(buyerId);
    
    if (quota.remainingSlots <= 0) {
      return NextResponse.json({ 
        error: "Has alcanzado el límite de estudiantes permitidos. Por favor adquiere más cupos." 
      }, { status: 403 });
    }

    const result = await StudentService.registerStudent({
      buyerId,
      name,
      email,
      documentType,
      documentNumber
    });

    // 4. Send activation email asynchronously
    try {
      await EmailService.sendActivationEmail(email, name, result.activationLink);
    } catch (emailError) {
      console.error("Failed to send activation email:", emailError);
      // We don't block the response even if email fails, as we still show the link in the UI
    }

    return NextResponse.json({ 
      message: "Estudiante registrado exitosamente. Se ha enviado un correo de activación.",
      activationLink: result.activationLink 
    });
  } catch (error: any) {
    console.error("Error registering student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const currentRole = (session.user as any).role;

    // Sincronizar rol (asegurar que todos son BUYER si tienen pagos o son legacy)
    await StudentService.syncUserRole(userId);

    // Obtener info del usuario y su rol actualizado
    const { data: dbUser } = await supabase
      .from("users")
      .select("role, registeredBy")
      .eq("id", userId)
      .single();

    const role = dbUser?.role || currentRole;

    // Obtener info de cupos
    const quota = await StudentService.getQuotaInfo(userId);
    
    // Check if user has any active enrollment
    const { count: enrollmentCount } = await supabase
      .from("enrollments")
      .select("id", { count: 'exact', head: true })
      .eq("studentId", userId)
      .eq("status", "ACTIVE");

    const hasEnrollment = (enrollmentCount || 0) > 0;
    
    // Obtener estudiantes registrados por este usuario (si es manager)
    const students = await StudentService.getStudentsByBuyer(userId);

    // Obtener cantidad de certificados
    const certifiedCount = await StudentService.getCertifiedCount(userId);

    return NextResponse.json({ 
      students, 
      quota, 
      role: "BUYER", // Forzamos reporte de BUYER para el dashboard
      hasEnrollment,
      certifiedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
