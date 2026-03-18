import { supabase } from "@/lib/supabase";

export async function verifyDocument(code: string, ipAddress?: string, userAgent?: string) {
  // 1. Intentar encontrar como certificado
  const { data: certificate, error: cError } = await supabase
    .from('certificates')
    .select(`
      *,
      student:users!studentId(name),
      examAttempt:exam_attempts(score, courseId, completedAt)
    `)
    .eq('certificateCode', code) // Ajustado al nombre de columna real en el nuevo schema
    .single();

  if (certificate) {
    // Log verification attempt
    await supabase.from('verification_logs').insert({
      documentType: "CERTIFICATE",
      documentCode: code,
      ipAddress,
      userAgent,
      verified: certificate.status === "VALID"
    });

    return {
      type: "CERTIFICATE" as const,
      valid: certificate.status === "VALID",
      data: {
        studentName: (certificate.student as any)?.name,
        courseName: (certificate.examAttempt as any)?.courseId,
        score: (certificate.examAttempt as any)?.score,
        issuedAt: certificate.createdAt,
        status: certificate.status,
        uniqueCode: certificate.certificateCode,
        documentHash: certificate.verificationHash
      }
    };
  }

  // 2. Intentar encontrar como plan de saneamiento
  const { data: plan, error: pError } = await supabase
    .from('sanitation_plans')
    .select(`
      *,
      owner:users!ownerId(name)
    `)
    .eq('certificateCode', code)
    .single();

  if (plan) {
    await supabase.from('verification_logs').insert({
      documentType: "SANITATION_PLAN",
      documentCode: code,
      ipAddress,
      userAgent,
      verified: plan.status === "COMPLETED"
    });

    return {
      type: "SANITATION_PLAN" as const,
      valid: plan.status === "COMPLETED" || plan.generation_status === "completed",
      data: {
        businessName: plan.businessName,
        businessType: plan.establishmentType,
        generatedAt: plan.createdAt,
        uniqueCode: plan.certificateCode,
        documentHash: plan.verificationHash,
        status: plan.status
      }
    };
  }

  // 3. No encontrado - Logeo de intento fallido
  if (ipAddress || userAgent) {
    await supabase.from('verification_logs').insert({
      documentType: "CERTIFICATE",
      documentCode: code,
      ipAddress,
      userAgent,
      verified: false
    });
  }

  return null;
}

export async function getVerificationLogs(limit = 50) {
  const { data, error } = await supabase
    .from('verification_logs')
    .select('*')
    .order('verifiedAt', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
