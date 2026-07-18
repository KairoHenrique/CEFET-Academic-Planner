import {
  REFERRAL_BONUS_CAP_DAYS,
  REFERRAL_REWARD_DAYS,
} from "@/lib/billing/referrals/referral-constants";

/** Dias a conceder respeitando o teto acumulado (cap − já ganho). */
export function computeReferralGrantDays(alreadyEarnedDays: number): number {
  const remaining = REFERRAL_BONUS_CAP_DAYS - Math.max(0, alreadyEarnedDays);
  if (remaining <= 0) {
    return 0;
  }
  return Math.min(REFERRAL_REWARD_DAYS, remaining);
}
