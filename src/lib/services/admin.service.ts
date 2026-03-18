import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { CertificateService } from "./certificate.service";

export class AdminService {
  static async getDashboardStats() {
    // 1. Total Usuarios
    const { count: userCount, error: uError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 2. Total Ventas (Suma de finalAmount en payments APPROVED)
    const { data: payments, error: pError } = await supabase
      .from('payments')
      .select('finalAmount')
      .eq('status', 'APPROVED');

    const totalSales = payments?.reduce((acc, curr) => acc + Number(curr.finalAmount), 0) || 0;

    // 3. Total Certificados Emitidos
    const { count: certCount, error: cError } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    // 4. Planes de Saneamiento Activos
    const { count: planCount, error: sError } = await supabase
      .from('sanitation_plans')
      .select('*', { count: 'exact', head: true });

    if (uError || pError || cError || sError) {
      console.error("Error fetching stats:", { uError, pError, cError, sError });
    }

    return {
      totalUsers: userCount || 0,
      totalSales,
      totalCertificates: certCount || 0,
      totalSanitationPlans: planCount || 0
    };
  }

  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*, certificates(id, createdAt, status, expiresAt)')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateUser(
    id: string,
    fields: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
      documentType?: string;
      documentNumber?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    const updates: Record<string, unknown> = {};

    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.role !== undefined) updates.role = fields.role;
    if (fields.phone !== undefined) updates.phone = fields.phone || null;
    if (fields.documentType !== undefined) updates.documentType = fields.documentType || null;
    if (fields.documentNumber !== undefined) updates.documentNumber = fields.documentNumber || null;
    if (fields.isActive !== undefined) updates.isActive = fields.isActive;
    if (fields.password) updates.passwordHash = await bcrypt.hash(fields.password, 12);

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserCourseStatus(userId: string) {
    // 1. Get all products that have an associated course
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('name, course:courses(id, title)');
    if (pErr) throw pErr;

    // 2. Get all valid certificates for this user from the certificates table
    const { data: userCerts } = await supabase
      .from('certificates')
      .select('id, status, expiresAt, enrollmentId')
      .eq('studentId', userId)
      .eq('status', 'VALID');

    const result = [];

    for (const product of products ?? []) {
      const courseData = Array.isArray((product as any).course)
        ? (product as any).course[0]
        : (product as any).course;

      // Skip products that are not courses (AI_SERVICE, etc.)
      if (!courseData?.id) continue;

      // 3. Find enrollment for this user + course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('studentId', userId)
        .eq('courseId', courseData.id)
        .maybeSingle();

      // 4. Match certificate via enrollmentId
      const validCert = enrollment
        ? userCerts?.find((c: any) => c.enrollmentId === enrollment.id)
        : null;

      result.push({
        courseId: courseData.id,
        title: courseData.title,
        productName: (product as any).name,
        enrollmentId: enrollment?.id ?? null,
        certificateId: validCert?.id ?? null,
        isApproved: !!validCert,
      });
    }

    return result;
  }

  static async approveCourseForUser(userId: string, courseId: string) {
    // 1. Find or create enrollment
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('studentId', userId)
      .eq('courseId', courseId)
      .maybeSingle();

    let enrollmentId: string;

    if (existing) {
      enrollmentId = existing.id;
    } else {
      const { data: created, error: eErr } = await supabase
        .from('enrollments')
        .insert({
          buyerId: userId,
          studentId: userId,
          courseId,
          status: 'ACTIVE',
        })
        .select('id')
        .single();
      if (eErr) throw eErr;
      enrollmentId = created.id;
    }

    // 2. Check if a valid certificate already exists in the certificates table
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id, status, expiresAt, createdAt')
      .eq('studentId', userId)
      .eq('enrollmentId', enrollmentId)
      .eq('status', 'VALID')
      .maybeSingle();

    if (existingCert) return existingCert;

    // 3. Insert new record into the certificates table
    const cert = await CertificateService.generateCertificate(userId, enrollmentId);
    return cert;
  }

  static async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        buyer:users!buyerId(name, email),
        product:products(name)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAllSanitationPlans() {
    const { data, error } = await supabase
      .from('sanitation_plans')
      .select(`
        *,
        owner:users!ownerId(name, email)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }
}
