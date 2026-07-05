import { normalizeCpf } from "@/lib/auth/account/cpf";

const INTERNAL_DOMAIN = "accounts.acme-hub.internal";

export function buildInternalAuthEmail(cpfRaw: string): string {
  const cpf = normalizeCpf(cpfRaw);
  return `cpf.${cpf}@${INTERNAL_DOMAIN}`;
}
