import { normalizeCpf } from "@/lib/auth/account/cpf";

export function maskCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length < 4) {
    return "***";
  }

  const last4 = digits.slice(-4);
  return `***.***.***-${last4}`;
}

export function cpfLast4(cpf: string): string {
  const digits = normalizeCpf(cpf);
  return digits.slice(-4);
}
