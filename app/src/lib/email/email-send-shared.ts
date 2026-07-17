/** Utilitários comuns aos provedores de e-mail transacional (B62b). */

/** Validação simples de destinatário (defesa antes de bater no provedor). */
export const RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Classifica falha HTTP p/ retry: 429 (rate limit) e 5xx são transitórios;
 * demais 4xx (payload/remetente inválido) são permanentes.
 */
export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}
