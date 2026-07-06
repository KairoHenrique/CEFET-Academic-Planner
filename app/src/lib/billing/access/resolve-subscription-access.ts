import { BILLING_RENEW_HREF } from "@/lib/auth/trial/constants";
import { resolveTrialSubscriptionForCpf } from "@/lib/auth/trial/trial-service";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import {
  expireSubscriptionsPastGraceForCpf,
  findActiveSubscriptionByCpf,
  findLatestExpiredPaidSubscriptionByCpf,
  findPendingPaymentSubscriptionByCpf,
  resolveAccessExpiryMetrics,
} from "@/lib/billing/access/subscription-access-repository";
import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";

export interface ResolvedSubscriptionAccess {
  planId: string;
  planLabel: string;
  status: PerfilSubscriptionStatus;
  expiresAt: string | null;
  daysRemaining: number;
  renewHref: string;
  inGracePeriod: boolean;
}

function fromPaidSubscription(
  subscription: {
    plan_id: string;
    status: PerfilSubscriptionStatus;
    expires_at: string;
  },
  now: Date
): ResolvedSubscriptionAccess {
  const metrics = resolveAccessExpiryMetrics(subscription.expires_at, now);

  return {
    planId: subscription.plan_id,
    planLabel: resolvePlanLabel(subscription.plan_id),
    status: metrics.inGracePeriod ? "active" : subscription.status,
    expiresAt: metrics.expiresAt,
    daysRemaining: metrics.daysRemaining,
    renewHref: BILLING_RENEW_HREF,
    inGracePeriod: metrics.inGracePeriod,
  };
}

export async function resolveSubscriptionAccessForCpf(
  cpf: string,
  now = new Date()
): Promise<ResolvedSubscriptionAccess> {
  await expireSubscriptionsPastGraceForCpf(cpf, now);

  const active = await findActiveSubscriptionByCpf(cpf, now);
  if (active) {
    return fromPaidSubscription(
      { plan_id: active.plan_id, status: "active", expires_at: active.expires_at },
      now
    );
  }

  const pending = await findPendingPaymentSubscriptionByCpf(cpf);
  if (pending) {
    return fromPaidSubscription(
      {
        plan_id: pending.plan_id,
        status: "pending_payment",
        expires_at: pending.expires_at,
      },
      now
    );
  }

  const trial = await resolveTrialSubscriptionForCpf(cpf);
  if (trial?.status === "trial_active") {
    return {
      planId: trial.planId,
      planLabel: trial.planLabel,
      status: "trial_active",
      expiresAt: trial.expiresAt,
      daysRemaining: trial.daysRemaining,
      renewHref: trial.renewHref,
      inGracePeriod: false,
    };
  }

  const expiredPaid = await findLatestExpiredPaidSubscriptionByCpf(cpf, now);
  if (expiredPaid) {
    return fromPaidSubscription(
      {
        plan_id: expiredPaid.plan_id,
        status: "expired",
        expires_at: expiredPaid.expires_at,
      },
      now
    );
  }

  if (trial?.status === "trial_expired") {
    return {
      planId: trial.planId,
      planLabel: trial.planLabel,
      status: "trial_expired",
      expiresAt: trial.expiresAt,
      daysRemaining: 0,
      renewHref: trial.renewHref,
      inGracePeriod: false,
    };
  }

  return {
    planId: "trial",
    planLabel: "Trial gratuito",
    status: "trial_expired",
    expiresAt: null,
    daysRemaining: 0,
    renewHref: BILLING_RENEW_HREF,
    inGracePeriod: false,
  };
}

export function isSubscriptionAccessAllowed(
  status: PerfilSubscriptionStatus
): boolean {
  return status === "trial_active" || status === "active";
}

export async function isCheckoutRenewalForUser(
  cpf: string,
  now = new Date()
): Promise<boolean> {
  await expireSubscriptionsPastGraceForCpf(cpf, now);
  const active = await findActiveSubscriptionByCpf(cpf, now);
  if (active) {
    return true;
  }

  const expired = await findLatestExpiredPaidSubscriptionByCpf(cpf, now);
  return expired != null;
}
