import { NextResponse } from "next/server";
import { CertificateService } from "@/lib/services/certificate.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const certificate = await CertificateService.verifyCertificate(code);
    return NextResponse.json(certificate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
