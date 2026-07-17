/**
 * Config do provedor transacional Resend (B62b).
 *
 * Lida a partir de variáveis de ambiente (secrets do Cloudflare no app cloud):
 *   - RESEND_API_KEY  → chave secreta da conta Resend (obrigatória)
 *   - EMAIL_FROM      → remetente verificado, ex.: "ACME HUB <no-reply@dominio>"
 *   - EMAIL_REPLY_TO  → opcional; endereço de resposta
 *
 * Segurança/LGPD: a API key nunca é logada nem exposta ao client. Quando não
 * configurada, `resolveResendConfig` retorna null e o cron cai no sender de log
 * (dev/local), sem quebrar o fluxo.
 */
export interface ResendConfig {
  apiKey: string;
  from: string;
  replyTo: string | null;
}

export function resolveResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  return {
    apiKey,
    from,
    replyTo: replyTo ? replyTo : null,
  };
}
