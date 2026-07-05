import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import { resolveTrialSubscriptionForCpf } from "@/lib/auth/trial/trial-service";
import { BILLING_RENEW_HREF } from "@/lib/auth/trial/constants";

export interface AppAccessSnapshot {
  status: PerfilSubscriptionStatus;
  renewHref: string;
  expiresAt: string | null;
  daysRemaining: number;
}

const ALLOWED_ACCESS_STATUSES = new Set<PerfilSubscriptionStatus>([
  "trial_active",
  "active",
]);

export function isAppAccessAllowed(status: PerfilSubscriptionStatus): boolean {
  return ALLOWED_ACCESS_STATUSES.has(status);
}

export async function resolveAppAccessForCpf(
  cpf: string
): Promise<AppAccessSnapshot> {
  const trial = await resolveTrialSubscriptionForCpf(cpf);
  if (trial?.status === "trial_active") {
    return {
      status: "trial_active",
      renewHref: trial.renewHref,
      expiresAt: trial.expiresAt,
      daysRemaining: trial.daysRemaining,
    };
  }

  if (trial?.status === "trial_expired") {
    return {
      status: "trial_expired",
      renewHref: BILLING_RENEW_HREF,
      expiresAt: trial.expiresAt,
      daysRemaining: 0,
    };
  }

  return {
    status: "trial_expired",
    renewHref: BILLING_RENEW_HREF,
    expiresAt: null,
    daysRemaining: 0,
  };
}
