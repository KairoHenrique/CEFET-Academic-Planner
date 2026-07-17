import { BILLING_RENEW_HREF } from "@/lib/auth/trial/constants";
import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import { resolvePlanosFlowForStatus } from "@/lib/billing/subscription-access-client";

/**
 * Destino pós-login/cadastro conforme a assinatura REAL do usuário:
 * - assinatura paga ativa → app (`/`);
 * - trial ativo → onboarding (`/planos?flow=welcome`);
 * - trial/pago expirado ou pagamento pendente → `/planos` com o flow correto.
 */
export function resolvePostAuthRedirect(subscription: {
  status: PerfilSubscriptionStatus;
}): string {
  const flow = resolvePlanosFlowForStatus(subscription.status);
  return flow ? `${BILLING_RENEW_HREF}?flow=${flow}` : "/";
}
