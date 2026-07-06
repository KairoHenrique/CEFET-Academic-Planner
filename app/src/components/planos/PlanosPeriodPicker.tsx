import type { BillingPlanView, PaidPlanId } from "@/lib/types/billing-api";

interface PlanosPeriodPickerProps {
  plans: BillingPlanView[];
  selectedPlanId: PaidPlanId;
  onSelect: (planId: PaidPlanId) => void;
}

export function PlanosPeriodPicker({
  plans,
  selectedPlanId,
  onSelect,
}: PlanosPeriodPickerProps) {
  const paidPlans = plans.filter((plan) => plan.kind === "paid");

  return (
    <div
      className="planos-picker"
      role="tablist"
      aria-label="Período do plano"
    >
      {paidPlans.map((plan) => {
        const isActive = plan.id === selectedPlanId;

        return (
          <button
            key={plan.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`planos-picker-btn${isActive ? " is-active" : ""}${
              plan.featured ? " is-featured" : ""
            }`}
            onClick={() => onSelect(plan.id)}
          >
            <span className="planos-picker-label">{plan.shortLabel}</span>
            <span className="planos-picker-price">{plan.priceLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
