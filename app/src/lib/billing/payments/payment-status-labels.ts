import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";

export function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: "Aguardando PIX",
    approved: "Pago",
    expired: "Expirado",
    rejected: "Recusado",
    cancelled: "Cancelado",
    refunded: "Estornado",
  };

  return labels[status];
}

export function paymentStatusTone(
  status: PaymentStatus
): "pending" | "success" | "danger" | "muted" {
  if (status === "pending") {
    return "pending";
  }
  if (status === "approved") {
    return "success";
  }
  if (status === "expired" || status === "rejected" || status === "cancelled") {
    return "danger";
  }
  return "muted";
}
