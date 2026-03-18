import { supabase } from "@/lib/supabase";
import { generateCertificateCode } from "@/lib/crypto/codes";

export class CertificateService {
  /**
   * Genera un nuevo certificado para un estudiante tras aprobar un examen.
   */
  static async generateCertificate(studentId: string, enrollmentId: string) {
    // 1. Verificar si ya existe un certificado para esta inscripción
    const { data: existing } = await supabase
      .from('certificates')
      .select('id, certificateCode, expiresAt')
      .eq('enrollmentId', enrollmentId)
      .maybeSingle();

    if (existing) {
      // Si el certificado existe pero está expirado, renovarlo
      const isExpired = existing.expiresAt && new Date(existing.expiresAt) < new Date();
      if (!isExpired) return existing;

      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
      const newVerificationHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { data: renewed, error: renewError } = await supabase
        .from('certificates')
        .update({
          status: 'VALID',
          expiresAt: newExpiresAt.toISOString(),
          verificationHash: newVerificationHash
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (renewError) throw renewError;
      return renewed;
    }

    // 2. Generar códigos únicos
    const certificateCode = generateCertificateCode();
    const verificationHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // 3. Calcular fecha de expiración (1 año después)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // 4. Crear el registro en la base de datos
    const insertData: any = {
      studentId,
      enrollmentId,
      certificateCode,
      verificationHash,
      status: 'VALID',
      expiresAt: expiresAt.toISOString()
    };

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("CRITICAL ERROR inserting certificate:", error);
      throw error;
    }
    
    return certificate;
  }

  /**
   * Obtiene los datos necesarios para renderizar el PDF del certificado.
   */
  static async getCertificateData(certificateId: string) {
    // 1. Get certificate only — no joins to avoid FK cache issues
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (error || !cert) throw new Error("Certificado no encontrado");

    // 2. Get student data
    const { data: student } = await supabase
      .from('users')
      .select('name, documentType, documentNumber')
      .eq('id', (cert as any).studentId)
      .maybeSingle();

    // 3. Get courseId from enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('courseId')
      .eq('id', (cert as any).enrollmentId)
      .maybeSingle();

    const courseId = (enrollment as any)?.courseId ?? null;

    // 4. Get passed exam attempt for completion date (optional — falls back to cert date)
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('completedAt, score')
      .eq('studentId', (cert as any).studentId)
      .eq('courseId', courseId)
      .eq('passed', true)
      .order('completedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      studentName: (student as any)?.name ?? null,
      documentType: (student as any)?.documentType ?? null,
      documentNumber: (student as any)?.documentNumber ?? null,
      courseId,
      completedDate: attempt?.completedAt || (cert as any).createdAt,
      certificateCode: (cert as any).certificateCode,
      verificationHash: (cert as any).verificationHash,
    };
  }

  /**
   * Verifica públicamente un certificado por su código único.
   */
  static async verifyCertificate(code: string) {
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        enrollment:enrollments (
          student:users!studentId(name),
          course:courses(title)
        )
      `)
      .eq('certificateCode', code)
      .single();

    if (error || !certificate) return null;

    // Aplanar la estructura para mantener compatibilidad con el frontend anterior
    const enrollment: any = certificate.enrollment;
    
    // Determinar el estado real basado en la fecha de expiración
    let status = certificate.status;
    const expiresAt = certificate.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      status = 'EXPIRED';
    }

    return {
      studentName: enrollment?.student?.name,
      courseTitle: enrollment?.course?.title,
      issuedAt: certificate.createdAt,
      expiresAt: expiresAt,
      status,
      certificateCode: certificate.certificateCode,
      verificationHash: certificate.verificationHash
    };
  }
}
