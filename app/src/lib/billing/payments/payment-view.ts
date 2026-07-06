import type { PaymentRow } from "@/lib/billing/schema/billing-row-types";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaidPlanId } from "@/lib/billing/types";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";

export interface BillingPaymentHistoryItem {
  id: string;
  planId: PaidPlanId;
  planLabel: string;
  amountCents: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
}

export interface BillingPaymentStatusView {
  id: string;
  planId: PaidPlanId;
  planLabel: string;
  amountCents: number;
  status: PaymentStatus;
  expiresAt: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string
): string | null {
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

export function mapPaymentHistoryItem(row: PaymentRow): BillingPaymentHistoryItem {
  return {
    id: row.id,
    planId: row.plan_id,
    planLabel: resolvePlanLabel(row.plan_id),
    amountCents: row.amount_cents,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    expiresAt: row.expires_at,
  };
}

export function mapPaymentStatusView(row: PaymentRow): BillingPaymentStatusView {
  return {
    id: row.id,
    planId: row.plan_id,
    planLabel: resolvePlanLabel(row.plan_id),
    amountCents: row.amount_cents,
    status: row.status,
    expiresAt: row.expires_at,
    qrCode: row.qr_code,
    qrCodeBase64: readMetadataString(row.metadata, "qrCodeBase64"),
    ticketUrl: readMetadataString(row.metadata, "ticketUrl"),
  };
}

export function isPaymentAwaitingConfirmation(status: PaymentStatus): boolean {
  return status === "pending";
}

export function isPaymentTerminalSuccess(status: PaymentStatus): boolean {
  return status === "approved";
}

export function isPaymentTerminalFailure(status: PaymentStatus): boolean {
  return status === "expired" || status === "rejected" || status === "cancelled";
}
