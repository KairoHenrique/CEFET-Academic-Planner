import { listPaymentsForUser } from "@/lib/billing/checkout/billing-payment-repository";
import {
  isCheckoutRenewalForUser,
  resolveSubscriptionAccessForCpf,
} from "@/lib/billing/access/resolve-subscription-access";
import { resolveAdsFreeEntitlement } from "@/lib/billing/access/resolve-ads-free";
import { mapPaymentHistoryItem } from "@/lib/billing/payments/payment-view";

export async function buildBillingAccountResponse(input: {
  userId: string;
  cpf: string;
}) {
  const access = await resolveSubscriptionAccessForCpf(input.cpf);
  const adsFree = await resolveAdsFreeEntitlement(input.cpf);
  const payments = await listPaymentsForUser(input.userId);
  const renewalEligible = await isCheckoutRenewalForUser(input.cpf);

  return {
    ok: true as const,
    subscription: {
      planId: adsFree.adsFree ? adsFree.planId : access.planId,
      planLabel: adsFree.adsFree ? adsFree.planLabel : access.planLabel,
      status: adsFree.adsFree ? ("active" as const) : access.status,
      expiresAt: adsFree.adsFree ? adsFree.expiresAt : access.expiresAt,
      daysRemaining: access.daysRemaining,
      renewHref: access.renewHref,
      inGracePeriod: access.inGracePeriod,
      renewalEligible,
    },
    adsFree: {
      active: adsFree.adsFree,
      expiresAt: adsFree.expiresAt,
      planId: adsFree.planId,
      planLabel: adsFree.planLabel,
      source: adsFree.source,
    },
    payments: payments.map(mapPaymentHistoryItem),
  };
}

export type BillingAccountResponse = Awaited<
  ReturnType<typeof buildBillingAccountResponse>
>;
