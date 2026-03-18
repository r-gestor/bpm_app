import crypto from "crypto";

/**
 * Generate SHA-256 hash of any data (used for PDF integrity verification)
 */
export function generateHash(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify a hash against the original data
 */
export function verifyHash(data: Buffer | string, expectedHash: string): boolean {
  const hash = generateHash(data);
  return hash === expectedHash;
}
