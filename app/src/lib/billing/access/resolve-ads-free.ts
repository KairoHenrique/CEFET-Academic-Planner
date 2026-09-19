import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import {
  expireSubscriptionsPastGraceForCpf,
  findActiveSubscriptionByCpf,
} from "@/lib/billing/access/subscription-access-repository";

export interface AdsFreeEntitlement {
  adsFree: boolean;
  planId: string | null;
  planLabel: string | null;
  expiresAt: string | null;
  source: string | null;
}

const EMPTY: AdsFreeEntitlement = {
  adsFree: false,
  planId: null,
  planLabel: null,
  expiresAt: null,
  source: null,
};

/**
 * Entitlement unificado web ↔ mobile: assinatura ativa = sem ads.
 * Independente de BILLING_ENFORCED (features sempre livres).
 */
export async function resolveAdsFreeEntitlement(
  cpf: string,
  now = new Date()
): Promise<AdsFreeEntitlement> {
  await expireSubscriptionsPastGraceForCpf(cpf, now);
  const active = await findActiveSubscriptionByCpf(cpf, now);
  if (!active) return EMPTY;

  return {
    adsFree: true,
    planId: active.plan_id,
    planLabel: resolvePlanLabel(active.plan_id),
    expiresAt: active.expires_at,
    source: active.source,
  };
}
