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

  static async getCourseProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, course:courses(id)");
    if (error) throw error;
    return (data || []).filter((p: any) => {
      const c = Array.isArray(p.course) ? p.course[0] : p.course;
      return !!c?.id;
    });
  }

  static async bulkRegisterUsers(
    _adminId: string,
    buyerRow: {
      name: string;
      email: string;
      documentType: string;
      documentNumber: string;
      password: string;
    },
    studentRows: Array<{
      name: string;
      email: string;
      documentType: string;
      documentNumber: string;
      password: string;
    }>,
    productId: string,
    includeBuyerAsStudent: boolean
  ) {
    if (!buyerRow?.email || !buyerRow?.name) {
      throw new Error("Falta la fila del comprador (primera fila del CSV).");
    }

    // 1. Validate product and course
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, price, slug, course:courses(id)")
      .eq("id", productId)
      .maybeSingle();
    if (pErr || !product) throw new Error("Producto no encontrado.");

    const courseData = Array.isArray((product as any).course)
      ? (product as any).course[0]
      : (product as any).course;
    if (!courseData?.id)
      throw new Error("El producto no tiene un curso asociado.");
    const courseId = courseData.id as string;

    const unitPrice = Number(product.price) || 0;

    // 2. Find-or-create the buyer user
    const buyerEmail = buyerRow.email.trim().toLowerCase();
    let buyerId: string;

    const { data: existingBuyer } = await supabase
      .from("users")
      .select("id")
      .eq("email", buyerEmail)
      .maybeSingle();

    if (existingBuyer) {
      buyerId = existingBuyer.id;
      const update: Record<string, unknown> = { role: "BUYER", isActive: true };
      if (buyerRow.password)
        update.passwordHash = await bcrypt.hash(buyerRow.password, 10);
      if (buyerRow.name) update.name = buyerRow.name;
      if (buyerRow.documentType) update.documentType = buyerRow.documentType;
      if (buyerRow.documentNumber)
        update.documentNumber = buyerRow.documentNumber;
      await supabase.from("users").update(update).eq("id", buyerId);
    } else {
      if (!buyerRow.password)
        throw new Error("El comprador requiere contraseña (nuevo usuario).");
      const passwordHash = await bcrypt.hash(buyerRow.password, 10);
      const { data: newBuyer, error: bErr } = await supabase
        .from("users")
        .insert({
          email: buyerEmail,
          name: buyerRow.name,
          passwordHash,
          role: "BUYER",
          documentType: buyerRow.documentType || null,
          documentNumber: buyerRow.documentNumber || null,
          isActive: true,
        })
        .select("id")
        .single();
      if (bErr || !newBuyer)
        throw new Error(
          bErr?.message || "No se pudo crear el usuario comprador."
        );
      buyerId = newBuyer.id;
    }

    const totalQuantity = studentRows.length + (includeBuyerAsStudent ? 1 : 0);

    // 3. APPROVED payment attributed to the BUYER (so quota sums in their dashboard)
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        buyerId,
        productId,
        amount: unitPrice * totalQuantity,
        finalAmount: unitPrice * totalQuantity,
        currency: "COP",
        status: "APPROVED",
        quantity: totalQuantity,
        discountApplied: false,
      })
      .select()
      .single();
    if (payErr) throw payErr;

    const created: Array<{ email: string; id: string }> = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    // 4. Create each student and enrollment under this buyer
    for (const row of studentRows) {
      const email = (row.email || "").trim().toLowerCase();
      if (!email || !row.name || !row.password) {
        skipped.push({ email, reason: "Campos obligatorios faltantes" });
        continue;
      }

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        skipped.push({ email, reason: "Ya existe un usuario con este correo" });
        continue;
      }

      const passwordHash = await bcrypt.hash(row.password, 10);

      const { data: newUser, error: uErr } = await supabase
        .from("users")
        .insert({
          email,
          name: row.name,
          passwordHash,
          role: "STUDENT",
          documentType: row.documentType || null,
          documentNumber: row.documentNumber || null,
          registeredBy: buyerId,
          isActive: true,
        })
        .select("id, email")
        .single();

      if (uErr || !newUser) {
        skipped.push({
          email,
          reason: uErr?.message || "Error al crear usuario",
        });
        continue;
      }

      const { error: enErr } = await supabase.from("enrollments").insert({
        buyerId,
        studentId: newUser.id,
        courseId,
        orderId: payment.id,
        status: "ACTIVE",
      });

      if (enErr) {
        skipped.push({
          email,
          reason: `Usuario creado pero enrollment falló: ${enErr.message}`,
        });
        continue;
      }

      created.push({ email: newUser.email, id: newUser.id });
    }

    // 5. Optionally enroll the buyer themself as a student
    let buyerEnrolled = false;
    if (includeBuyerAsStudent) {
      await supabase
        .from("users")
        .update({ registeredBy: buyerId })
        .eq("id", buyerId);

      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("studentId", buyerId)
        .eq("courseId", courseId)
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: selfErr } = await supabase.from("enrollments").insert({
          buyerId,
          studentId: buyerId,
          courseId,
          orderId: payment.id,
          status: "ACTIVE",
        });
        if (!selfErr) buyerEnrolled = true;
      } else {
        buyerEnrolled = true;
      }
    }

    return {
      paymentId: payment.id,
      buyerId,
      buyerEmail,
      totalQuantity,
      createdCount: created.length,
      skippedCount: skipped.length,
      buyerEnrolled,
      created,
      skipped,
    };
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
