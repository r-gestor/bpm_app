import QRCode from "qrcode";
import { env } from "@/config/env";

/**
 * Generate a QR code as a data URL (base64 PNG)
 * The QR links to the public verification page
 */
export async function generateVerificationQR(uniqueCode: string): Promise<string> {
  const verificationUrl = `${env.APP_URL}/verify/${uniqueCode}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: "#1a1a2e",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
  return qrDataUrl;
}

/**
 * Generate QR code as a Buffer (for embedding in PDFs)
 */
export async function generateVerificationQRBuffer(uniqueCode: string): Promise<Buffer> {
  const verificationUrl = `${env.APP_URL}/verify/${uniqueCode}`;
  const buffer = await QRCode.toBuffer(verificationUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: "#1a1a2e",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
  return buffer;
}
