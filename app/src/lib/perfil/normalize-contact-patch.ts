import { validationError } from "@/lib/api/errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeOptionalEmail(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw validationError("Informe um e-mail válido.");
  }
  return trimmed.toLowerCase();
}

export function normalizeOptionalPhone(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 11) {
    throw validationError("Informe um celular válido (10 ou 11 dígitos).");
  }
  return digits;
}
