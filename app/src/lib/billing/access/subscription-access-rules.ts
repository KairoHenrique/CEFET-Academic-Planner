import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import { BILLING_ENFORCED } from "@/lib/billing/free-mode";

export function isSubscriptionAccessAllowed(
  status: PerfilSubscriptionStatus
): boolean {
  if (!BILLING_ENFORCED) {
    return true;
  }
  return status === "trial_active" || status === "active";
}

export function isSubscriptionBlocked(status: PerfilSubscriptionStatus): boolean {
  return !isSubscriptionAccessAllowed(status);
}
