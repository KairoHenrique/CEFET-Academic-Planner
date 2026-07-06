import { notFoundError } from "@/lib/api/errors";
import { findPaymentByIdForUser } from "@/lib/billing/checkout/billing-payment-repository";
import { mapPaymentStatusView } from "@/lib/billing/payments/payment-view";

export async function getBillingPaymentStatusForUser(input: {
  paymentId: string;
  userId: string;
}) {
  const payment = await findPaymentByIdForUser(input.paymentId, input.userId);
  if (!payment) {
    throw notFoundError("Pagamento não encontrado.");
  }

  return {
    ok: true as const,
    payment: mapPaymentStatusView(payment),
  };
}
