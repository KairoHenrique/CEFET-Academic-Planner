import { notFoundError } from "@/lib/api/errors";
import {
  findPaymentByExternalReference,
  findPaymentByGatewayPaymentId,
  updatePaymentStatus,
} from "@/lib/billing/checkout/billing-payment-repository";
import {
  activateSubscriptionAfterPayment,
  findPlanDurationDays,
} from "@/lib/billing/checkout/billing-subscription-repository";
import type { PaymentGateway } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaymentRow } from "@/lib/billing/schema/billing-row-types";
import type { SubscriptionRow } from "@/lib/billing/schema/billing-row-types";

export interface ConfirmBillingPaymentInput {
  gateway: PaymentGateway;
  gatewayPaymentId?: string | null;
  externalReference?: string | null;
  mappedStatus: PaymentStatus | null;
}

export interface ConfirmBillingPaymentResult {
  ok: true;
  processed: boolean;
  payment: PaymentRow;
  subscription: SubscriptionRow | null;
}

async function resolvePaymentForConfirmation(
  input: ConfirmBillingPaymentInput
): Promise<PaymentRow> {
  if (input.gatewayPaymentId?.trim()) {
    const byGateway = await findPaymentByGatewayPaymentId(
      input.gateway,
      input.gatewayPaymentId.trim()
    );
    if (byGateway) {
      return byGateway;
    }
  }

  if (input.externalReference?.trim()) {
    const byReference = await findPaymentByExternalReference(
      input.externalReference.trim()
    );
    if (byReference) {
      return byReference;
    }
  }

  throw notFoundError("Pagamento não encontrado para confirmação.");
}

export async function confirmBillingPayment(
  input: ConfirmBillingPaymentInput
): Promise<ConfirmBillingPaymentResult> {
  if (!input.mappedStatus) {
    const payment = await resolvePaymentForConfirmation(input);
    return {
      ok: true,
      processed: false,
      payment,
      subscription: null,
    };
  }

  const payment = await resolvePaymentForConfirmation(input);

  if (payment.status === input.mappedStatus) {
    return {
      ok: true,
      processed: false,
      payment,
      subscription: null,
    };
  }

  const paidAt =
    input.mappedStatus === "approved" ? new Date().toISOString() : null;

  const updatedPayment = await updatePaymentStatus({
    paymentId: payment.id,
    status: input.mappedStatus,
    paidAt,
  });

  if (input.mappedStatus !== "approved" || !payment.subscription_id) {
    return {
      ok: true,
      processed: true,
      payment: updatedPayment,
      subscription: null,
    };
  }

  const durationDays = await findPlanDurationDays(payment.plan_id);
  const subscription = await activateSubscriptionAfterPayment({
    subscriptionId: payment.subscription_id,
    durationDays,
  });

  return {
    ok: true,
    processed: true,
    payment: updatedPayment,
    subscription,
  };
}
