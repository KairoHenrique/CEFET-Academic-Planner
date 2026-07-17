import { parseEmailAddress, type ParsedEmailAddress } from "@/lib/email/email-from";

/**
 * Config do provedor transacional Brevo (B62b) — plano grátis (300/dia),
 * verificação de remetente único (sem domínio próprio obrigatório).
 *
 * Env (secrets no app cloud):
 *   - BREVO_API_KEY  → chave da conta Brevo (obrigatória)
 *   - EMAIL_FROM     → "ACME HUB <remetente@dominio>" (remetente VERIFICADO na Brevo)
 *   - EMAIL_REPLY_TO → opcional
 *
 * Segurança/LGPD: a API key nunca é logada nem exposta ao client.
 */
export interface BrevoConfig {
  apiKey: string;
  sender: ParsedEmailAddress;
  replyTo: string | null;
}

export function resolveBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  return {
    apiKey,
    sender: parseEmailAddress(from),
    replyTo: replyTo ? replyTo : null,
  };
}
