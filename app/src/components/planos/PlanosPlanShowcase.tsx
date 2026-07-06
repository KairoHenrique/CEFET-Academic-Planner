import type { BillingPlansResponse, BillingPlanView, PaidPlanId } from "@/lib/types/billing-api";
import { resolvePlanSavingsLabel } from "@/components/planos/planos-plan-utils";

interface PlanosPlanShowcaseProps {
  plan: BillingPlanView;
  catalog: BillingPlansResponse;
  selectingPlanId: PaidPlanId | null;
  onCheckout: (planId: PaidPlanId) => void;
}

export function PlanosPlanShowcase({
  plan,
  catalog,
  selectingPlanId,
  onCheckout,
}: PlanosPlanShowcaseProps) {
  const isSelecting = selectingPlanId === plan.id;
  const savings =
    plan.kind === "paid"
      ? resolvePlanSavingsLabel(catalog, plan.id)
      : null;
  const checkoutDisabled = !catalog.checkoutEnabled || Boolean(selectingPlanId);

  return (
    <article
      className={`card planos-showcase${plan.featured ? " planos-showcase--featured" : ""}`}
      aria-labelledby="planos-showcase-title"
    >
      {plan.featured ? (
        <span className="planos-showcase-badge">Recomendado</span>
      ) : null}

      <p className="planos-showcase-duration">{plan.durationLabel}</p>
      <h2 id="planos-showcase-title" className="planos-showcase-title">
        {plan.shortLabel}
      </h2>
      <p className="planos-showcase-price">{plan.priceLabel}</p>

      {savings ? <p className="planos-showcase-savings">{savings}</p> : null}

      <p className="planos-showcase-copy">{plan.description}</p>

      <button
        type="button"
        className="btn-gold planos-showcase-cta"
        disabled={checkoutDisabled}
        aria-busy={isSelecting}
        onClick={() => onCheckout(plan.id as PaidPlanId)}
      >
        {isSelecting
          ? "Gerando PIX…"
          : catalog.checkoutEnabled
            ? plan.ctaLabel
            : `${plan.ctaLabel} (em breve)`}
      </button>

      <p className="planos-showcase-footnote">
        Confirmação automática após o pagamento PIX.
      </p>
    </article>
  );
}
