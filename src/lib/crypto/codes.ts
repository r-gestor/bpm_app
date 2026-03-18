import { v4 as uuidv4 } from "uuid";
import { CERTIFICATE_CODE_PREFIX, SANITATION_CODE_PREFIX } from "@/config/constants";

/**
 * Generate a unique alphanumeric code for certificates
 * Format: BPM-CERT-XXXXXXXX
 */
export function generateCertificateCode(): string {
  const suffix = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `${CERTIFICATE_CODE_PREFIX}-${suffix}`;
}

/**
 * Generate a unique alphanumeric code for sanitation plans
 * Format: BPM-SAN-XXXXXXXX
 */
export function generateSanitationCode(): string {
  const suffix = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `${SANITATION_CODE_PREFIX}-${suffix}`;
}

/**
 * Generate a generic unique code with a custom prefix
 */
export function generateUniqueCode(prefix: string): string {
  const suffix = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}
