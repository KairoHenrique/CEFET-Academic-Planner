import { listPaymentsForUser } from "@/lib/billing/checkout/billing-payment-repository";
import {
  isCheckoutRenewalForUser,
  resolveSubscriptionAccessForCpf,
} from "@/lib/billing/access/resolve-subscription-access";
import { mapPaymentHistoryItem } from "@/lib/billing/payments/payment-view";

export async function buildBillingAccountResponse(input: {
  userId: string;
  cpf: string;
}) {
  const access = await resolveSubscriptionAccessForCpf(input.cpf);
  const payments = await listPaymentsForUser(input.userId);
  const renewalEligible = await isCheckoutRenewalForUser(input.cpf);

  return {
    ok: true as const,
    subscription: {
      planId: access.planId,
      planLabel: access.planLabel,
      status: access.status,
      expiresAt: access.expiresAt,
      daysRemaining: access.daysRemaining,
      renewHref: access.renewHref,
      inGracePeriod: access.inGracePeriod,
      renewalEligible,
    },
    payments: payments.map(mapPaymentHistoryItem),
  };
}

export type BillingAccountResponse = Awaited<
  ReturnType<typeof buildBillingAccountResponse>
>;
