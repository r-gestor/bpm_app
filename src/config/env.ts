import { z } from "zod";

// ─── Environment validation ────────────────────────────────

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  OPENAI_API_KEY: z.string().startsWith("sk-"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SIGNER_NAME: z.string().default("Dr. María García López"),
  SIGNER_TITLE: z.string().default("Profesional Sanitario Responsable"),
  SIGNER_LICENSE: z.string().default("COL-12345"),
});

// Use partial for development - not all keys may be set immediately
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production-32chars",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  SIGNER_NAME: process.env.SIGNER_NAME || "Dr. María García López",
  SIGNER_TITLE: process.env.SIGNER_TITLE || "Profesional Sanitario Responsable",
  SIGNER_LICENSE: process.env.SIGNER_LICENSE || "COL-12345",
};
