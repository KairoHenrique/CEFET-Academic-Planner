import type { BillingPlansResponse, PaidPlanId } from "@/lib/types/billing-api";

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
  const featured = catalog.plans.find(
    (plan) => plan.kind === "paid" && plan.featured
  );
  if (featured?.kind === "paid") {
    return featured.id as PaidPlanId;
  }

  const firstPaid = catalog.plans.find((plan) => plan.kind === "paid");
  return firstPaid?.kind === "paid" ? (firstPaid.id as PaidPlanId) : "month";
}
