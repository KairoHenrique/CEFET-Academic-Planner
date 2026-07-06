import type { PixGatewayId } from "@/lib/billing/gateway/types";
import type { PaidPlanId } from "@/lib/billing/types";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import type { SubscriptionStatus } from "@/lib/billing/schema/billing-schema-catalog";

export interface BillingCheckoutInput {
  userId: string;
  cpf: string;
  email: string;
  planId: PaidPlanId;
  idempotencyKey: string;
}

export interface BillingCheckoutPaymentView {
  id: string;
  planId: PaidPlanId;
  amountCents: number;
  currency: "BRL";
  status: PaymentStatus;
  gateway: PixGatewayId;
  externalReference: string;
  idempotencyKey: string;
  expiresAt: string;
  qrCode: string;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export interface BillingCheckoutSubscriptionView {
  id: string;
  planId: PaidPlanId;
  status: SubscriptionStatus;
  expiresAt: string;
}

export interface BillingCheckoutResponse {
  ok: true;
  reused: boolean;
  payment: BillingCheckoutPaymentView;
  subscription: BillingCheckoutSubscriptionView;
}
