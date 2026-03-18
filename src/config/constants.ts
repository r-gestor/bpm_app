export const APP_NAME = "BPM Salud";
export const APP_DESCRIPTION = "Plataforma de servicios sanitarios y formación online";

export const CURRENCY = "EUR";
export const DEFAULT_DISCOUNT_CODE = "BPM10";
export const DEFAULT_DISCOUNT_PERCENT = 10;

export const EXAM_QUESTIONS_PER_ATTEMPT = 20;
export const DEFAULT_PASSING_SCORE = 70;

export const CERTIFICATE_CODE_PREFIX = "BPM-CERT";
export const SANITATION_CODE_PREFIX = "BPM-SAN";

export const ROLES = {
  ADMIN: "ADMIN",
  BUYER: "BUYER",
  STUDENT: "STUDENT",
} as const;

export const ORDER_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
} as const;

export const PRODUCT_TYPES = {
  COURSE: "COURSE",
  SANITATION_PLAN: "SANITATION_PLAN",
} as const;
