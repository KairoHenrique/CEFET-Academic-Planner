import { notFoundError } from "@/lib/api/errors";
import {
  findPaymentByExternalReference,
  findPaymentByGatewayPaymentId,
  updatePaymentStatus,
} from "@/lib/billing/checkout/billing-payment-repository";
import {
  activateSubscriptionAfterPayment,
  findPlanDurationDays,
  findSubscriptionById,
} from "@/lib/billing/checkout/billing-subscription-repository";
import { applyReferralRewardsAfterPaidActivation } from "@/lib/billing/referrals/apply-referral-rewards";
import type { PaymentGateway } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaymentRow } from "@/lib/billing/schema/billing-row-types";
import type { SubscriptionRow } from "@/lib/billing/schema/billing-row-types";
import type { PaidPlanId } from "@/lib/billing/types";

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

/**
 * Ativação idempotente: garante a liberação da assinatura mesmo quando o
 * pagamento já estava `approved` de uma tentativa anterior que falhou na etapa
 * de ativação (a atualização do pagamento e a ativação não são atômicas).
 *
 * Só ativa quando a assinatura ainda está `pending_payment` — assim evita
 * ressuscitar assinaturas já `active`/`expired`/`cancelled` em reentregas do
 * webhook (que estenderiam o prazo indevidamente).
 */
async function ensureSubscriptionActivated(input: {
  subscriptionId: string;
  userId: string;
  planId: PaidPlanId;
}): Promise<{ subscription: SubscriptionRow | null; activated: boolean }> {
  const existing = await findSubscriptionById(input.subscriptionId);
  if (!existing || existing.status !== "pending_payment") {
    return { subscription: existing, activated: false };
  }

  const durationDays = await findPlanDurationDays(input.planId);
  const subscription = await activateSubscriptionAfterPayment({
    subscriptionId: input.subscriptionId,
    userId: input.userId,
    durationDays,
  });

  return { subscription, activated: true };
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

  let payment = await resolvePaymentForConfirmation(input);
  const statusChanged = payment.status !== input.mappedStatus;

  if (statusChanged) {
    const paidAt =
      input.mappedStatus === "approved" ? new Date().toISOString() : null;
    payment = await updatePaymentStatus({
      paymentId: payment.id,
      status: input.mappedStatus,
      paidAt,
    });
  }

  // Reconciliação idempotente: mesmo que o pagamento já estivesse aprovado,
  // garante a ativação da assinatura (cura falhas parciais de tentativas
  // anteriores e evita cobrança sem liberação de plano).
  if (input.mappedStatus === "approved" && payment.subscription_id) {
    const { subscription, activated } = await ensureSubscriptionActivated({
      subscriptionId: payment.subscription_id,
      userId: payment.user_id,
      planId: payment.plan_id,
    });

    if (activated) {
      await applyReferralRewardsAfterPaidActivation({
        referredUserId: payment.user_id,
      }).catch(() => undefined);
    }

    return {
      ok: true,
      processed: statusChanged || activated,
      payment,
      subscription,
    };
  }

  return {
    ok: true,
    processed: statusChanged,
    payment,
    subscription: null,
  };
}
