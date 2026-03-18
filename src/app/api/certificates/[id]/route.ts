import { NextRequest, NextResponse } from "next/server";
import React from 'react';
import { renderToStream } from "@react-pdf/renderer";
import CourseCertificate from "@/components/courses/CourseCertificate";
import { CertificateService } from "@/lib/services/certificate.service";
import QRCode from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: certificateId } = await params;
    const certData = await CertificateService.getCertificateData(certificateId);

    // Generate QR Code data URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify/${certData.certificateCode}`;
    const qrCodeData = await QRCode.toDataURL(verificationUrl);

    // Format date
    const date = new Date(certData.completedDate);
    const formattedDate = date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Get absolute paths for images
    const path = require('path');
    const fs = require('fs');
    
    const logoPath = path.join(process.cwd(), 'public', 'certificate', 'logo.png');
    const signaturePath = path.join(process.cwd(), 'public', 'certificate', 'firmaDigital.png');
    
    let logoBuffer = null;
    let signatureBuffer = null;
    
    try {
      logoBuffer = fs.readFileSync(logoPath);
      signatureBuffer = fs.readFileSync(signaturePath);
    } catch (fsError) {
      console.error("Error reading certificate assets:", fsError);
    }

    const studentName   = certData.studentName   || "Sin nombre";
    const documentType  = certData.documentType  || "CC";
    const documentNumber = certData.documentNumber || "Sin documento";

    // Render PDF to stream
    const stream = await renderToStream(
      React.createElement(CourseCertificate as any, {
        studentName,
        documentType,
        documentNumber,
        completedDate: formattedDate,
        qrCodeData: qrCodeData,
        certificateCode: certData.certificateCode,
        logoUrl: logoBuffer,
        signatureUrl: signatureBuffer
      }) as any
    );

    // Convert stream to readable stream for Next.js response
    const response = new NextResponse(stream as any);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="Certificado_${studentName.replace(/\s+/g, '_')}.pdf"`
    );

    return response;
  } catch (error: any) {
    console.error("Error generating certificate PDF:", error);
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
  }
}
