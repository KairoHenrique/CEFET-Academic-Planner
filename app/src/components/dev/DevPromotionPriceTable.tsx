"use client";

import type { BillingPlanView, SitePromoPublic } from "@/lib/types/billing-api";
import { formatBrlCents } from "@/lib/billing/format-brl-cents";
import { DevStatusPill } from "@/components/dev/DevStatusPill";

interface DevPromotionPriceTableProps {
  plans: BillingPlanView[];
  promo: SitePromoPublic | null;
}

export function DevPromotionPriceTable({
  plans,
  promo,
}: DevPromotionPriceTableProps) {
  const paidPlans = plans.filter((plan) => plan.kind === "paid");

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Plano</th>
            <th>Duração</th>
            <th>Preço atual</th>
            <th>Promoção</th>
          </tr>
        </thead>
        <tbody>
          {paidPlans.map((plan) => {
            const isPromo = promo?.highlightPlanId === plan.id;
            return (
              <tr key={plan.id}>
                <td>
                  <strong>{plan.label}</strong>
                </td>
                <td>{plan.durationLabel}</td>
                <td>
                  {isPromo && promo ? (
                    <span className="dev-promo-price-cell">
                      <s className="dev-table-meta">
                        {formatBrlCents(promo.basePriceCents)}
                      </s>{" "}
                      <strong>{formatBrlCents(promo.promoPriceCents)}</strong>
                    </span>
                  ) : (
                    plan.priceLabel
                  )}
                </td>
                <td>
                  {isPromo && promo ? (
                    <DevStatusPill tone="warn">
                      -{promo.discountPercent}%
                    </DevStatusPill>
                  ) : (
                    <span className="dev-table-meta">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
