import { buildTrialSubscriptionSnapshot } from "@/lib/auth/trial/trial-status";
import { getConfig } from "@/lib/db/queries";
import { buildPerfilSubscription } from "@/lib/perfil/build-subscription-dev";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import type { DevAccountSubscriptionView } from "@/lib/dev-panel/types";
import type { PerfilSubscription, PerfilSubscriptionStatus } from "@/lib/types/perfil-api";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Linha da assinatura paga mais relevante (JOIN em `subscriptions`). */
export interface DevPaidSubscriptionRow {
  plan_id: string;
  status: string;
  expires_at: Date;
}

function daysUntil(expiresMs: number, now: number): number {
  return Math.max(0, Math.ceil((expiresMs - now) / DAY_MS));
}

/** Mapeia a assinatura paga para a visão do painel; null → cair no trial. */
function mapPaidSubscription(
  row: DevPaidSubscriptionRow
): DevAccountSubscriptionView | null {
  const now = Date.now();
  const expiresAtIso = row.expires_at.toISOString();
  const expiresMs = row.expires_at.getTime();

  let status: PerfilSubscriptionStatus | null = null;
  if (row.status === "active") {
    status = expiresMs > now ? "active" : "expired";
  } else if (row.status === "pending_payment") {
    status = "pending_payment";
  } else if (row.status === "expired") {
    status = "expired";
  } else if (row.status === "cancelled") {
    status = "cancelled";
  }

  if (!status) {
    return null;
  }

  return {
    planId: row.plan_id,
    planLabel: resolvePlanLabel(row.plan_id),
    status,
    expiresAt: expiresAtIso,
    daysRemaining: status === "active" ? daysUntil(expiresMs, now) : 0,
    trialStartedAt: null,
  };
}

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
  trialStartedAt: Date | null,
  paid?: DevPaidSubscriptionRow | null
): DevAccountSubscriptionView | null {
  // Assinatura paga (active/pending/expired) tem precedência sobre o trial.
  if (paid) {
    const view = mapPaidSubscription(paid);
    if (view) {
      return view;
    }
  }

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
