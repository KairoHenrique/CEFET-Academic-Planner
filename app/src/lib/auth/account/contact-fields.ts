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
