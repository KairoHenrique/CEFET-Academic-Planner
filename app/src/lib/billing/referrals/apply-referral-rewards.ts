import {
  extendSubscriptionExpiresAt,
  findLatestActiveSubscriptionForUser,
  insertActiveReferralSubscription,
} from "@/lib/billing/checkout/billing-subscription-repository";
import { computeReferralBonusExpiresAt } from "@/lib/billing/referrals/compute-referral-bonus-expires-at";
import { computeReferralGrantDays } from "@/lib/billing/referrals/compute-referral-grant-days";
import { REFERRAL_PLAN_ID } from "@/lib/billing/referrals/referral-constants";
import {
  claimReferralForReward,
  findPendingReferralByReferredUserId,
  sumReferralBonusDaysForUser,
} from "@/lib/billing/referrals/referral-repository";

async function grantReferralAccessDays(input: {
  userId: string;
  cpf: string;
  days: number;
}): Promise<void> {
  if (input.days <= 0) {
    return;
  }

  const active = await findLatestActiveSubscriptionForUser(input.userId);
  if (active && Date.parse(active.expires_at) > Date.now()) {
    await extendSubscriptionExpiresAt(active.id, input.days);
    return;
  }

  const expiresAt = await computeReferralBonusExpiresAt({
    userId: input.userId,
    cpf: input.cpf,
    durationDays: input.days,
  });

  await insertActiveReferralSubscription({
    userId: input.userId,
    planId: REFERRAL_PLAN_ID,
    expiresAt,
  });
}

/**
 * Após ativação de assinatura paga (PIX): concede +3 dias (cap 30) ao
 * indicador e ao indicado. Idempotente — só recompensa referral `pending`.
 */
export async function applyReferralRewardsAfterPaidActivation(input: {
  referredUserId: string;
}): Promise<{ rewarded: boolean; referrerDays: number; referredDays: number }> {
  const pending = await findPendingReferralByReferredUserId(
    input.referredUserId
  );
  if (!pending) {
    return { rewarded: false, referrerDays: 0, referredDays: 0 };
  }

  const [referrerEarned, referredEarned] = await Promise.all([
    sumReferralBonusDaysForUser(pending.referrer_user_id),
    sumReferralBonusDaysForUser(pending.referred_user_id),
  ]);

  const referrerDays = computeReferralGrantDays(referrerEarned);
  const referredDays = computeReferralGrantDays(referredEarned);

  const claimed = await claimReferralForReward({
    referralId: pending.id,
    referrerDaysGranted: referrerDays,
    referredDaysGranted: referredDays,
  });

  if (!claimed) {
    return { rewarded: false, referrerDays: 0, referredDays: 0 };
  }

  await grantReferralAccessDays({
    userId: pending.referred_user_id,
    cpf: pending.referred_cpf,
    days: referredDays,
  });

  await grantReferralAccessDays({
    userId: pending.referrer_user_id,
    cpf: pending.referrer_cpf,
    days: referrerDays,
  });

  return { rewarded: true, referrerDays, referredDays };
}
