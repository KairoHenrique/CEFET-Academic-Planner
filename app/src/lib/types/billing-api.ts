import type {
  BillingPaymentHistoryItem,
  BillingPaymentStatusView,
} from "@/lib/billing/payments/payment-view";

export type {
  BillingPlanId,
  BillingPlanSavings,
  BillingPlanView,
  BillingPlansResponse,
  PaidPlanId,
} from "@/lib/billing/types";

export type {
  BillingCheckoutPaymentView,
  BillingCheckoutResponse,
  BillingCheckoutSubscriptionView,
} from "@/lib/billing/checkout/types";

export type { BillingAccountResponse } from "@/lib/billing/account/build-billing-account-response";

export type { BillingPaymentHistoryItem, BillingPaymentStatusView };

export interface BillingPaymentStatusResponse {
  ok: true;
  payment: BillingPaymentStatusView;
}

export interface BillingCheckoutRequestBody {
  planId: import("@/lib/billing/types").PaidPlanId;
  idempotencyKey?: string;
}

export interface RedeemGiftKeyRequestBody {
  code: string;
}

export interface RedeemGiftKeyResponse {
  ok: true;
  code: string;
  planId: string;
  planLabel: string;
  subscription: {
    id: string;
    status: "active";
    expiresAt: string;
    source: "gift_key";
  };
}

