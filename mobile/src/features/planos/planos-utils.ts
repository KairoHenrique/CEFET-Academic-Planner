import type {
  BillingPlansResponse,
  PaidPlanId,
} from "@acme/api-contracts";

export type PlanosFlow = "welcome" | "renew" | "pending" | "exists";

export function parsePlanosFlow(value: string | null | undefined): PlanosFlow | null {
  if (
    value === "welcome" ||
    value === "renew" ||
    value === "pending" ||
    value === "exists"
  ) {
    return value;
  }
  return null;
}

export function resolvePlanosFlowForStatus(status: string): PlanosFlow | null {
  if (status === "trial_expired" || status === "expired") return "renew";
  if (status === "pending_payment") return "pending";
  if (status === "trial_active") return "welcome";
  return null;
}

export function resolvePlanSavingsLabel(
  catalog: BillingPlansResponse,
  planId: PaidPlanId
): string | null {
  switch (planId) {
    case "quarter":
      return catalog.quarterSavings?.label ?? null;
    case "semester":
      return catalog.semesterSavings?.label ?? null;
    case "year":
      return catalog.yearSavings?.label ?? null;
    case "five_year":
      return catalog.fiveYearSavings?.label ?? null;
    default:
      return null;
  }
}

export function resolveDefaultPaidPlanId(
  catalog: BillingPlansResponse
): PaidPlanId {
  const highlightId = catalog.promo?.highlightPlanId ?? null;
  if (highlightId) {
    const highlighted = catalog.plans.find(
      (plan) => plan.kind === "paid" && plan.id === highlightId
    );
    if (highlighted?.kind === "paid") return highlighted.id;
  }

  const featured = catalog.plans.find(
    (plan) => plan.kind === "paid" && plan.featured
  );
  if (featured?.kind === "paid") return featured.id;

  const firstPaid = catalog.plans.find((plan) => plan.kind === "paid");
  return firstPaid?.kind === "paid" ? firstPaid.id : "semester";
}

export function formatBrlCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function resolvePriceLabel(priceCents: number | null | undefined): string {
  if (priceCents == null) return "Preço em definição";
  return formatBrlCents(priceCents);
}

export function normalizeGiftInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function isPaymentTerminalSuccess(status: string): boolean {
  return status === "approved";
}

export function isPaymentTerminalFailure(status: string): boolean {
  return (
    status === "expired" || status === "rejected" || status === "cancelled"
  );
}

export function isPaymentAwaitingConfirmation(status: string): boolean {
  return status === "pending";
}

export function resolvePromoExpiresAt(promo: {
  expiresAt?: string | null;
  endsAt?: string | null;
}): string | null {
  return promo.expiresAt ?? promo.endsAt ?? null;
}
