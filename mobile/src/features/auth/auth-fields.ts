import type { AuthCursoOption } from "@acme/api-contracts";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeTelefone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidTelefone(raw: string): boolean {
  const digits = normalizeTelefone(raw);
  return digits.length === 10 || digits.length === 11;
}

export function formatPhoneInput(raw: string): string {
  const digits = normalizeTelefone(raw).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const LEGAL_TERMS_VERSION = "2026-07-01";
export const LEGAL_PRIVACY_VERSION = "2026-07-01";

export function buildLegalConsentPayload(accepted: boolean) {
  return {
    terms: accepted,
    privacy: accepted,
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
  };
}

/** Fallback se `/api/auth/config` falhar. */
export const DEFAULT_AUTH_CURSOS: AuthCursoOption[] = [
  { id: "eng-computacao", label: "Engenharia da Computação" },
  { id: "eng-mecatronica", label: "Engenharia Mecatrônica" },
  { id: "design-moda", label: "Design de Moda" },
];
