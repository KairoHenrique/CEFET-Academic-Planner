import { notFoundError, validationError } from "@/lib/api/errors";
import {
  insertActiveGiftSubscription,
} from "@/lib/billing/checkout/billing-subscription-repository";
import { computePaidSubscriptionExpiresAt } from "@/lib/billing/subscription/compute-subscription-expires-at";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import {
  findGiftKeyByCode,
  markExpiredGiftKeys,
  redeemGiftKeyAtomic,
} from "./gift-key-repository";
import { assertGiftKeyRedeemRateLimit } from "./gift-key-redeem-rate-limit";
import { normalizeGiftKeyCode } from "./gift-key-schema";
import { findPendingPaymentSubscriptionByCpf } from "@/lib/billing/access/subscription-access-repository";

export interface RedeemGiftKeyInput {
  userId: string;
  cpf: string;
  code: string;
  clientIp?: string | null;
}

export interface RedeemGiftKeyResult {
  ok: true;
  code: string;
  planId: string;
  planLabel: string;
  subscription: {
    id: string;
    status: "active";
    expiresAt: string;
    source: "gift_key";
  };
}

export async function redeemGiftKey(
  input: RedeemGiftKeyInput
): Promise<RedeemGiftKeyResult> {
  const code = normalizeGiftKeyCode(input.code);
  const rateScope = `${input.cpf}:${input.clientIp ?? "unknown"}`;
  assertGiftKeyRedeemRateLimit(rateScope);

  await markExpiredGiftKeys();

  const pending = await findPendingPaymentSubscriptionByCpf(input.cpf);
  if (pending) {
    throw validationError(
      "Há um pagamento PIX pendente. Conclua ou aguarde expirar antes de resgatar uma chave."
    );
  }

  const redeemed = await redeemGiftKeyAtomic({ code, cpf: input.cpf });
  if (!redeemed) {
    const existing = await findGiftKeyByCode(code);
    if (!existing) {
      throw notFoundError("Chave não encontrada.");
    }

    if (existing.status === "redeemed") {
      throw validationError("Esta chave já foi utilizada.");
    }

    if (existing.status === "revoked") {
      throw validationError("Esta chave foi revogada.");
    }

    if (existing.status === "expired") {
      throw validationError("Esta chave expirou.");
    }

    throw validationError("Chave indisponível para resgate.");
  }

  const expiresAt = await computePaidSubscriptionExpiresAt({
    userId: input.userId,
    durationDays: redeemed.duration_days,
  });

  const subscription = await insertActiveGiftSubscription({
    userId: input.userId,
    planId: redeemed.plan_id,
    durationDays: redeemed.duration_days,
    expiresAt,
  });

  return {
    ok: true,
    code: redeemed.code,
    planId: redeemed.plan_id,
    planLabel: resolvePlanLabel(redeemed.plan_id),
    subscription: {
      id: subscription.id,
      status: "active",
      expiresAt: subscription.expires_at,
      source: "gift_key",
    },
  };
}
