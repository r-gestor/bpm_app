import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function enrollStudent(data: {
  buyerId: string;
  studentEmail: string;
  studentName: string;
  courseId: string;
  orderId: string;
}) {
  // 1. Buscar o crear estudiante
  const { data: existingStudent, error: sError } = await supabase
    .from('users')
    .select('*')
    .eq('email', data.studentEmail)
    .single();

  let studentId = existingStudent?.id;

  if (!existingStudent) {
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    const { data: newStudent, error: nError } = await supabase
      .from('users')
      .insert({
        email: data.studentEmail,
        name: data.studentName,
        passwordHash,
        role: "STUDENT"
      })
      .select()
      .single();

    if (nError) throw nError;
    studentId = newStudent.id;
    // TODO: Enviar email con contraseña temporal
  }

  // 2. Verificar inscripción existente
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('studentId', studentId)
    .eq('courseId', data.courseId)
    .single();

  if (existingEnrollment) {
    throw new Error("El estudiante ya está inscrito en este curso");
  }

  // 3. Crear inscripción
  const { data: enrollment, error: eError } = await supabase
    .from('enrollments')
    .insert({
      buyerId: data.buyerId,
      studentId: studentId,
      courseId: data.courseId,
      orderId: data.orderId,
      status: "ACTIVE"
    })
    .select(`
      *,
      student:users!studentId(id, name, email),
      course:courses(id, title)
    `)
    .single();

  if (eError) throw eError;
  return enrollment;
}

export async function getBuyerEnrollments(buyerId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:users!studentId(id, name, email),
      course:courses(
        id,
        title,
        totalLessons,
        product:products(name, imageUrl)
      )
    `)
    .eq('buyerId', buyerId)
    .order('enrolledAt', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentEnrollments(studentId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        *,
        product:products(name, imageUrl, slug)
      )
    `)
    .eq('studentId', studentId)
    .eq('status', "ACTIVE")
    .order('enrolledAt', { ascending: false });

  if (error) throw error;
  return data;
}

export async function isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('studentId', studentId)
    .eq('courseId', courseId)
    .eq('status', "ACTIVE")
    .single();

  return !!data;
}
