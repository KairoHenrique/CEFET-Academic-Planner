import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";

const MERCADOPAGO_STATUS_MAP: Record<string, PaymentStatus | null> = {
  approved: "approved",
  authorized: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
  expired: "expired",
  pending: null,
  in_process: null,
  in_mediation: null,
};

export function mapMercadoPagoPaymentStatus(
  status: string | undefined
): PaymentStatus | null {
  if (!status?.trim()) {
    return null;
  }

  return MERCADOPAGO_STATUS_MAP[status.trim().toLowerCase()] ?? null;
}

export function isMercadoPagoApprovedStatus(status: string | undefined): boolean {
  return mapMercadoPagoPaymentStatus(status) === "approved";
}
