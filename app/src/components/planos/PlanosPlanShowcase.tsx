import type { BillingPlansResponse, BillingPlanView, PaidPlanId } from "@/lib/types/billing-api";
import { resolvePlanSavingsLabel } from "@/components/planos/planos-plan-utils";
import { formatBrlCents } from "@/lib/billing/format-brl-cents";

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
  const isPromoPlan =
    plan.kind === "paid" && catalog.promo?.highlightPlanId === plan.id;

  return (
    <article
      className={`card planos-showcase${plan.featured ? " planos-showcase--featured" : ""}${
        isPromoPlan ? " planos-showcase--promo" : ""
      }`}
      aria-labelledby="planos-showcase-title"
    >
      {isPromoPlan ? (
        <span className="planos-showcase-badge planos-showcase-badge--promo">
          {catalog.promo?.badge ?? "Promoção"}
        </span>
      ) : plan.featured ? (
        <span className="planos-showcase-badge">Recomendado</span>
      ) : null}

      <p className="planos-showcase-duration">{plan.durationLabel}</p>
      <h2 id="planos-showcase-title" className="planos-showcase-title">
        {plan.shortLabel}
      </h2>
      {isPromoPlan && catalog.promo ? (
        <p className="planos-showcase-base-price">
          {formatBrlCents(catalog.promo.basePriceCents)}
        </p>
      ) : null}
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
