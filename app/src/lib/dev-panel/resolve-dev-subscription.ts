import { buildTrialSubscriptionSnapshot } from "@/lib/auth/trial/trial-status";
import { getConfig } from "@/lib/db/queries";
import { buildPerfilSubscription } from "@/lib/perfil/build-subscription-dev";
import { runWithUserDb } from "@/lib/db/connection-manager";
import type { DevAccountSubscriptionView } from "@/lib/dev-panel/types";
import type { PerfilSubscription } from "@/lib/types/perfil-api";

function mapPerfilSubscription(
  sub: PerfilSubscription,
  trialStartedAt: string | null
): DevAccountSubscriptionView {
  return {
    planId: sub.planId,
    planLabel: sub.planLabel,
    status: sub.status,
    expiresAt: sub.expiresAt,
    daysRemaining: sub.daysRemaining,
    trialStartedAt,
  };
}

export function resolveSqliteDevSubscription(
  cpf: string
): DevAccountSubscriptionView | null {
  return runWithUserDb(cpf, () => {
    const sub = buildPerfilSubscription();
    const trialStartedAt =
      sub.planId === "trial"
        ? getConfig("account.trial_started_at")?.trim() || null
        : null;
    return mapPerfilSubscription(sub, trialStartedAt);
  });
}

export function resolvePostgresDevSubscription(
  trialStartedAt: Date | null
): DevAccountSubscriptionView | null {
  if (!trialStartedAt) {
    return null;
  }

  const snapshot = buildTrialSubscriptionSnapshot(trialStartedAt);
  return {
    planId: snapshot.planId,
    planLabel: snapshot.planLabel,
    status: snapshot.status,
    expiresAt: snapshot.expiresAt,
    daysRemaining: snapshot.daysRemaining,
    trialStartedAt: snapshot.trialStartedAt,
  };
}
