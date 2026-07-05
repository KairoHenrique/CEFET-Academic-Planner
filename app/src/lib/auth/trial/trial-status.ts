import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import {
  BILLING_RENEW_HREF,
  TRIAL_DURATION_MS,
  TRIAL_PLAN_ID,
  TRIAL_PLAN_LABEL,
} from "@/lib/auth/trial/constants";

export interface TrialSubscriptionSnapshot {
  planId: string;
  planLabel: string;
  status: Extract<PerfilSubscriptionStatus, "trial_active" | "trial_expired">;
  trialStartedAt: string;
  expiresAt: string;
  daysRemaining: number;
  renewHref: string;
}

function computeDaysRemaining(expiresAt: Date, now: Date): number {
  const msRemaining = expiresAt.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return 0;
  }
  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
}

export function computeTrialExpiresAt(trialStartedAt: Date): Date {
  return new Date(trialStartedAt.getTime() + TRIAL_DURATION_MS);
}

export function buildTrialSubscriptionSnapshot(
  trialStartedAt: Date,
  now = new Date()
): TrialSubscriptionSnapshot {
  const expiresAt = computeTrialExpiresAt(trialStartedAt);
  const daysRemaining = computeDaysRemaining(expiresAt, now);
  const status: TrialSubscriptionSnapshot["status"] =
    daysRemaining > 0 ? "trial_active" : "trial_expired";

  return {
    planId: TRIAL_PLAN_ID,
    planLabel: TRIAL_PLAN_LABEL,
    status,
    trialStartedAt: trialStartedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    daysRemaining,
    renewHref: BILLING_RENEW_HREF,
  };
}
