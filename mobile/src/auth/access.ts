import type { PerfilSubscriptionStatus } from "@acme/api-contracts";

/** Features academicas sempre liberadas — ads_free e opcional. */
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

/** Sempre home — sem paywall de funcionalidade. */
export function resolveAppDestination(
  _status: PerfilSubscriptionStatus
): AppDestination {
  return "home";
}

export function subscriptionStatusLabel(
  status: PerfilSubscriptionStatus
): string {
  switch (status) {
    case "active":
      return "Sem anúncios";
    case "trial_active":
      return "Acesso gratuito";
    case "pending_payment":
      return "Pagamento pendente";
    case "expired":
    case "trial_expired":
    case "cancelled":
      return "Com anúncios (gratuito)";
    default:
      return "Gratuito";
  }
}
