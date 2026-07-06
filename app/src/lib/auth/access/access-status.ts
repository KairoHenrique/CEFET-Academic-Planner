import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import {
  isSubscriptionAccessAllowed,
  resolveSubscriptionAccessForCpf,
} from "@/lib/billing/access/resolve-subscription-access";

export interface AppAccessSnapshot {
  status: PerfilSubscriptionStatus;
  renewHref: string;
  expiresAt: string | null;
  daysRemaining: number;
}

export function isAppAccessAllowed(status: PerfilSubscriptionStatus): boolean {
  return isSubscriptionAccessAllowed(status);
}

export async function resolveAppAccessForCpf(
  cpf: string
): Promise<AppAccessSnapshot> {
  const access = await resolveSubscriptionAccessForCpf(cpf);

  return {
    status: access.status,
    renewHref: access.renewHref,
    expiresAt: access.expiresAt,
    daysRemaining: access.daysRemaining,
  };
}
