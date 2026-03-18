import { NextResponse } from "next/server";
import { CertificateService } from "@/lib/services/certificate.service";
import { AiPlanService } from "@/lib/services/ai-plan.service";

export async function POST(req: Request) {
  try {
    const { code, method } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Código no proporcionado" }, { status: 400 });
    }

    // Extract code from QR content — it may be a full URL
    let extractedCode = code.trim();

    // If it's a URL, extract the last path segment
    if (extractedCode.includes("/verify/")) {
      const parts = extractedCode.split("/verify/");
      extractedCode = parts[parts.length - 1];
    } else if (extractedCode.startsWith("http")) {
      const url = new URL(extractedCode);
      const segments = url.pathname.split("/").filter(Boolean);
      extractedCode = segments[segments.length - 1] || extractedCode;
    }

    // Regex patterns
    const certMatch = extractedCode.match(/BPM-CERT-[A-Z0-9]+/i);
    const planMatch = extractedCode.match(/BPM-SAN-[A-Z0-9]+/i);

    console.log("[verify/check] Raw code:", code, "→ Extracted:", extractedCode);

    // 1. Try Certificate Verification
    if (certMatch) {
      const targetCode = certMatch[0].toUpperCase();
      const certData = await CertificateService.verifyCertificate(targetCode);
      
      if (certData) {
        const isValid = certData.status === "VALID";
        const status = isValid ? "active" : certData.status === "EXPIRED" ? "expired" : "invalid";

        return NextResponse.json({
          valid: isValid,
          type: 'CERTIFICATE',
          name: certData.studentName,
          course: certData.courseTitle,
          issued_at: certData.issuedAt,
          expires_at: certData.expiresAt,
          status: status,
          certificateCode: certData.certificateCode
        });
      }
    }

    // 2. Try Sanitation Plan Verification
    if (planMatch || extractedCode.includes("BPM-SAN")) {
      const targetCode = (planMatch ? planMatch[0] : extractedCode).toUpperCase();
      const planData = await AiPlanService.verifyPlan(targetCode);
      
      console.log("[verify/check] Plan lookup for:", targetCode, "Result:", planData ? "FOUND" : "NOT FOUND");
      
      if (planData) {
        return NextResponse.json({
          valid: planData.status === 'VALID',
          type: 'SANITATION_PLAN',
          businessName: planData.businessName,
          representativeName: planData.representativeName,
          nit: planData.nit,
          issued_at: planData.createdAt,
          status: planData.status === 'VALID' ? 'active' : 'processing',
          certificateCode: planData.planCode
        });
      }
    }

    // 3. Fallback: try both if no pattern matched
    const [certData, planData] = await Promise.all([
      CertificateService.verifyCertificate(extractedCode.toUpperCase()),
      AiPlanService.verifyPlan(extractedCode.toUpperCase())
    ]);

    if (certData) {
      const isValid = certData.status === "VALID";
      const status = isValid ? "active" : certData.status === "EXPIRED" ? "expired" : "invalid";
      return NextResponse.json({
        valid: isValid,
        type: 'CERTIFICATE',
        name: certData.studentName,
        course: certData.courseTitle,
        issued_at: certData.issuedAt,
        status,
        certificateCode: certData.certificateCode
      });
    }

    if (planData) {
      return NextResponse.json({
        valid: planData.status === 'VALID',
        type: 'SANITATION_PLAN',
        businessName: planData.businessName,
        representativeName: planData.representativeName,
        nit: planData.nit,
        issued_at: planData.createdAt,
        status: planData.status === 'VALID' ? 'active' : 'processing',
        certificateCode: planData.planCode
      });
    }

    return NextResponse.json({
      valid: false,
      status: "invalid",
      message: "El código no corresponde a un documento válido emitido por nuestro sistema"
    });

  } catch (error: any) {
    console.error("[verify/check] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
