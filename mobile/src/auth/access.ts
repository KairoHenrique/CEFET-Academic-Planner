import type { PerfilSubscriptionStatus } from "@acme/api-contracts";

/** Espelha `subscription-access-rules.ts` do site (M4). */
export function isSubscriptionAccessAllowed(
  status: PerfilSubscriptionStatus
): boolean {
  return status === "trial_active" || status === "active";
}

export function isSubscriptionBlocked(
  status: PerfilSubscriptionStatus
): boolean {
  return !isSubscriptionAccessAllowed(status);
}

export type AppDestination = "home" | "paywall";

/**
 * Destino pós-auth no app (paridade com resolvePostAuthRedirect do web).
 * Trial ativo e pago ativo → home; demais → paywall (planos).
 */
export function resolveAppDestination(
  status: PerfilSubscriptionStatus
): AppDestination {
  return isSubscriptionAccessAllowed(status) ? "home" : "paywall";
}

export function subscriptionStatusLabel(
  status: PerfilSubscriptionStatus
): string {
  switch (status) {
    case "trial_active":
      return "Trial ativo";
    case "active":
      return "Assinatura ativa";
    case "trial_expired":
      return "Trial expirado";
    case "pending_payment":
      return "Pagamento pendente";
    case "expired":
      return "Assinatura expirada";
    case "cancelled":
      return "Assinatura cancelada";
    default:
      return status;
  }
}
