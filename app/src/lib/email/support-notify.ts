/**
 * Destino de avisos internos (cadastro / pagamento).
 * Preferir SUPPORT_NOTIFY_EMAIL no ambiente; nunca logar o valor em claro em excesso.
 */
export function resolveSupportNotifyEmail(): string {
  const fromEnv = process.env.SUPPORT_NOTIFY_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) {
    return fromEnv.toLowerCase();
  }
  return "acme.hubsuporte@gmail.com";
}

/** CPF mascarado para e-mail/ops (LGPD — evita PII completa em caixa de entrada compartilhada). */
export function maskCpfForSupport(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}
