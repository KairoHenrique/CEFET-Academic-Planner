/**
 * Produto 100% gratuito (decisão de produto, set/2026).
 *
 * Motivo: remover paywall/PIX da experiência do aluno CEFET-MG.
 * O código de billing (planos, checkout, gift keys) permanece no repo como
 * legado dormante — facilita reativar cobrança no futuro sem reescrever tudo.
 *
 * Efeitos:
 * - BILLING_ENFORCED=false → gate de API/UI nunca bloqueia por assinatura
 * - APP_IS_FREE=true → checkout PIX recusado; e-mails de “fim de trial” não enfileiram
 * - resolveSubscriptionAccessForCpf devolve snapshot “active / gratuito”
 *
 * @see README.md §3 D1 (Decisões de desenho)
 */
export const APP_IS_FREE = true;

/** Quando false, o gate de assinatura não bloqueia nenhuma rota/API. */
export const BILLING_ENFORCED = false;
