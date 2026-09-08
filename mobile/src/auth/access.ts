import type { PerfilSubscriptionStatus } from "@acme/api-contracts";

/** App gratuito — nunca bloqueia por assinatura. */
export function isSubscriptionAccessAllowed(
  _status: PerfilSubscriptionStatus
): boolean {
  return true;
}

export function isSubscriptionBlocked(
  status: PerfilSubscriptionStatus
): boolean {
  return !isSubscriptionAccessAllowed(status);
}

export type AppDestination = "home" | "paywall";

/** Sempre home — paywall desativado. */
export function resolveAppDestination(
  _status: PerfilSubscriptionStatus
): AppDestination {
  return "home";
}

export function subscriptionStatusLabel(
  status: PerfilSubscriptionStatus
): string {
  switch (status) {
    case "trial_active":
    case "active":
      return "Acesso gratuito";
    case "trial_expired":
    case "pending_payment":
    case "expired":
    case "cancelled":
      return "Acesso gratuito";
    default:
      return "Acesso gratuito";
  }
}
