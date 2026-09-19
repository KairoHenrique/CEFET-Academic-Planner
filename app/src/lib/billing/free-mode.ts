/**
 * Modelo de produto (set/2026+):
 * - Features academicas = sempre gratuitas (sem paywall de funcionalidade).
 * - Monetizacao = plano opcional "sem propaganda" (PIX na web / Play no APK / gift).
 *
 * BILLING_ENFORCED=false → gate de API academica nunca bloqueia por assinatura.
 * APP_IS_FREE=true → app gratis forever (sem trial/paywall de features; e-mails de trial off).
 * ADS_REMOVAL_CHECKOUT_ENABLED=true → checkout PIX (web) para remover ads.
 */
export const BILLING_ENFORCED = false;

/** App gratuito para funcoes academicas (sem trial obrigatorio). */
export const APP_IS_FREE = true;

/** Checkout PIX (web) para plano sem ads. */
export const ADS_REMOVAL_CHECKOUT_ENABLED = true;
