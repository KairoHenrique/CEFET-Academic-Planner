import type { BillingPlansResponse, PaidPlanId } from "@/lib/types/billing-api";
import { PlanosTrialStrip } from "@/components/planos/PlanosTrialStrip";

interface PlanosGridProps {
  catalog: BillingPlansResponse;
  selectingPlanId?: PaidPlanId | null;
  onSelectPlan?: (planId: PaidPlanId) => void;
}

export function PlanosGrid({
  catalog,
  selectingPlanId = null,
  onSelectPlan,
}: PlanosGridProps) {
  const trialPlan = catalog.plans.find((plan) => plan.kind === "trial");
  const paidPlans = catalog.plans.filter((plan) => plan.kind === "paid");

  return (
    <div className="planos-catalog">
      {trialPlan ? (
        <PlanosTrialStrip plan={trialPlan} trialPolicy={catalog.trialPolicy} />
      ) : null}

      <div className="planos-grid">
        {paidPlans.map((plan) => {
          const isSelecting = selectingPlanId === plan.id;
          const checkoutDisabled =
            !catalog.checkoutEnabled || !onSelectPlan || Boolean(selectingPlanId);

          return (
            <article
              key={plan.id}
              className={`card planos-card${plan.featured ? " planos-card--featured" : ""}`}
            >
              {plan.featured ? (
                <span className="planos-card-badge">Mais popular</span>
              ) : null}

              <div className="planos-card-body">
                <h2 className="planos-card-title">{plan.shortLabel}</h2>
                <p className="planos-card-duration">{plan.durationLabel}</p>
                <p className="planos-card-price">{plan.priceLabel}</p>

                {plan.id === "quarter" && catalog.quarterSavings?.label ? (
                  <p className="planos-card-savings">{catalog.quarterSavings.label}</p>
                ) : null}
                {plan.id === "semester" && catalog.semesterSavings?.label ? (
                  <p className="planos-card-savings">{catalog.semesterSavings.label}</p>
                ) : null}
                {plan.id === "year" && catalog.yearSavings?.label ? (
                  <p className="planos-card-savings">{catalog.yearSavings.label}</p>
                ) : null}
                {plan.id === "five_year" && catalog.fiveYearSavings?.label ? (
                  <p className="planos-card-savings">{catalog.fiveYearSavings.label}</p>
                ) : null}

                <p className="planos-card-copy">{plan.description}</p>
              </div>

              <div className="planos-card-footer">
                <button
                  type="button"
                  className={plan.featured ? "btn-gold planos-card-cta" : "btn-outline planos-card-cta"}
                  disabled={checkoutDisabled}
                  aria-busy={isSelecting}
                  onClick={() => onSelectPlan?.(plan.id)}
                >
                  {isSelecting
                    ? "Gerando PIX…"
                    : catalog.checkoutEnabled
                      ? plan.ctaLabel
                      : `${plan.ctaLabel} (em breve)`}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
