import { getConfig } from "@/lib/db/queries";
import type { PerfilSubscription } from "@/lib/types/perfil-api";
import { ensureTrialStartedAt } from "@/lib/perfil/build-account";

const TRIAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial gratuito",
  semester: "Plano semestre",
  year: "Plano anual",
};

function addDays(iso: string, days: number): string {
  const base = Date.parse(iso);
  if (!Number.isFinite(base)) return new Date(Date.now() + days * MS_PER_DAY).toISOString();
  return new Date(base + days * MS_PER_DAY).toISOString();
}

function computeDaysRemaining(expiresAt: string, now = Date.now()): number {
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return 0;
  return Math.max(0, Math.ceil((expiresMs - now) / MS_PER_DAY));
}

export function buildPerfilSubscription(): PerfilSubscription {
  const planId = getConfig("subscription.plan_id")?.trim() || "trial";
  const status =
    (getConfig("subscription.status")?.trim() as PerfilSubscription["status"]) ||
    "trial_active";

  const configuredExpiresAt = getConfig("subscription.expires_at")?.trim();
  const expiresAt =
    configuredExpiresAt ||
    (planId === "trial"
      ? addDays(ensureTrialStartedAt(), TRIAL_DAYS)
      : addDays(new Date().toISOString(), 180));

  const daysRemaining = computeDaysRemaining(expiresAt);

  return {
    planId,
    planLabel: PLAN_LABELS[planId] ?? planId,
    status,
    expiresAt,
    daysRemaining,
    renewHref: "/planos",
  };
}
