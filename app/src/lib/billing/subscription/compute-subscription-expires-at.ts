import { findLatestActiveSubscriptionForUser } from "@/lib/billing/checkout/billing-subscription-repository";
import {
  isWithinGracePeriod,
  resolveGracePeriodDays,
} from "@/lib/billing/renewal/resolve-grace-period-days";

export async function computePaidSubscriptionExpiresAt(input: {
  userId: string;
  durationDays: number;
  excludeSubscriptionId?: string;
  now?: Date;
}): Promise<Date> {
  const now = input.now ?? new Date();
  const graceDays = resolveGracePeriodDays();
  const previous = await findLatestActiveSubscriptionForUser(
    input.userId,
    input.excludeSubscriptionId
  );

  let base = now;

  if (previous) {
    const previousExpires = Date.parse(previous.expires_at);
    if (previousExpires > now.getTime()) {
      base = new Date(previousExpires);
    } else if (
      isWithinGracePeriod(previous.expires_at, graceDays, now)
    ) {
      base = now;
    }
  }

  return new Date(base.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
}
