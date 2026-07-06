import { BILLING_RENEW_HREF } from "@/lib/auth/trial/constants";
import type { TrialSubscriptionSnapshot } from "@/lib/auth/trial/trial-status";

export function resolvePostAuthRedirect(
  subscription: TrialSubscriptionSnapshot
): string {
  if (subscription.status === "trial_expired") {
    return `${BILLING_RENEW_HREF}?flow=renew`;
  }

  return `${BILLING_RENEW_HREF}?flow=welcome`;
}
