/** Tabelas billing — alinhado à migration B49. */

export const BILLING_GLOBAL_TABLES = ["plans"] as const;

export const BILLING_TENANT_TABLES = ["subscriptions", "payments"] as const;

export const SUBSCRIPTION_STATUSES = [
  "trial_active",
  "trial_expired",
  "pending_payment",
  "active",
  "expired",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_SOURCES = [
  "trial",
  "pix",
  "gift_key",
  "manual",
  "referral",
] as const;

export type SubscriptionSource = (typeof SUBSCRIPTION_SOURCES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_GATEWAYS = ["mock", "mercadopago", "asaas"] as const;

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}
