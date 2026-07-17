import { notFoundError } from "@/lib/api/errors";
import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { insertActiveManualSubscription } from "@/lib/billing/checkout/billing-subscription-repository";
import { computePaidSubscriptionExpiresAt } from "@/lib/billing/subscription/compute-subscription-expires-at";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import type { PaidPlanId } from "@/lib/billing/types";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { resolveDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import type {
  DevGrantSubscriptionRequest,
  DevGrantSubscriptionResult,
} from "@/lib/dev-panel/types";

/**
 * Concede uma assinatura ativa (source `manual`) a uma conta a partir do painel
 * dev, com duração customizável em dias. Os dias são SOMADOS ao tempo restante
 * da assinatura ativa atual (não substitui/zera) — mesma regra do resgate de
 * gift key. Mantém uma única assinatura ativa (single-active) com o novo prazo.
 */
export async function grantDevSubscription(
  input: DevGrantSubscriptionRequest
): Promise<DevGrantSubscriptionResult> {
  await ensurePostgresReady();

  const cpf = await resolveDevAccountRef(input.accountRef);
  const profile = await findProfileByCpf(cpf);
  if (!profile) {
    throw notFoundError("Conta não encontrada para a referência informada.");
  }

  const expiresAt = await computePaidSubscriptionExpiresAt({
    userId: profile.userId,
    durationDays: input.days,
  });
  const subscription = await insertActiveManualSubscription({
    userId: profile.userId,
    planId: input.planId as PaidPlanId,
    expiresAt,
  });

  return {
    planId: input.planId,
    planLabel: resolvePlanLabel(input.planId),
    cpfLast4: cpf.slice(-4),
    subscription: {
      id: subscription.id,
      status: "active",
      expiresAt: subscription.expires_at,
      daysGranted: input.days,
    },
  };
}
