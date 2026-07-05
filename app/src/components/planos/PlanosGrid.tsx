import type { BillingPlansResponse } from "@/lib/types/billing-api";

interface PlanosGridProps {
  catalog: BillingPlansResponse;
}

export function PlanosGrid({ catalog }: PlanosGridProps) {
  return (
    <>
      <div className="planos-grid">
        {catalog.plans.map((plan) => (
          <article
            key={plan.id}
            className={`card planos-card${plan.featured ? " planos-card--featured" : ""}`}
          >
            <h2 className="planos-card-title">{plan.shortLabel}</h2>
            <p className="planos-card-duration">{plan.durationLabel}</p>
            {plan.kind === "paid" ? (
              <p className="planos-card-price">{plan.priceLabel}</p>
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
            {plan.purchasable ? (
              <button
                type="button"
                className={plan.featured ? "btn-gold" : "btn-outline"}
                disabled={!catalog.checkoutEnabled}
              >
                {catalog.checkoutEnabled
                  ? plan.ctaLabel
                  : `${plan.ctaLabel} (em breve)`}
              </button>
            ) : (
              <p className="planos-card-note">{plan.ctaLabel}</p>
            )}
          </article>
        ))}
      </div>

      <p className="planos-policy-note">
        Trial gratuito de {catalog.trialPolicy.durationDays} dias,{" "}
        <strong>uma vez por CPF</strong> (login SIGAA).
      </p>
    </>
  );
}
