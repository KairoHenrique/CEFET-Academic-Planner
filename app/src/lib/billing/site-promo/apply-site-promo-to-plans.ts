import { resolvePriceLabel } from "@/lib/billing/format-brl-cents";
import { getActiveSitePromo } from "@/lib/billing/site-promo/site-promo-store";
import type { BillingPlanView, BillingPlansResponse } from "@/lib/billing/types";

/**
 * Aplica a promoção ativa sobre a resposta de planos: sobrescreve o preço do
 * plano em oferta pelo preço promocional e anexa o objeto `promo` (banner).
 * Sem promoção ativa, devolve a resposta base com `promo: null`.
 */
export async function applyActiveSitePromo(
  base: BillingPlansResponse,
  now = new Date()
): Promise<BillingPlansResponse> {
  const promo = await getActiveSitePromo(now);
  if (!promo) {
    return { ...base, promo: null };
  }

  const plans: BillingPlanView[] = base.plans.map((plan) => {
    if (plan.kind !== "paid" || plan.id !== promo.highlightPlanId) {
      return plan;
    }
    return {
      ...plan,
      priceCents: promo.promoPriceCents,
      priceLabel: resolvePriceLabel(promo.promoPriceCents),
    };
  });

  return { ...base, plans, promo };
}
