import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";

export function isSubscriptionAccessAllowed(
  status: PerfilSubscriptionStatus
): boolean {
  return status === "trial_active" || status === "active";
}

export function isSubscriptionBlocked(status: PerfilSubscriptionStatus): boolean {
  return !isSubscriptionAccessAllowed(status);
}
