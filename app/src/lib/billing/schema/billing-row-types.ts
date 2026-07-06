import type {
  PaymentGateway,
  PaymentStatus,
  SubscriptionSource,
  SubscriptionStatus,
} from "./billing-schema-catalog";
import type { PaidPlanId } from "@/lib/billing/types";

export interface PlanRow {
  id: PaidPlanId;
  label: string;
  duration_days: number;
  price_cents: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: PaidPlanId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: PaidPlanId;
  amount_cents: number;
  currency: "BRL";
  status: PaymentStatus;
  gateway: PaymentGateway;
  gateway_payment_id: string | null;
  external_reference: string;
  idempotency_key: string;
  payer_cpf: string | null;
  qr_code: string | null;
  expires_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
