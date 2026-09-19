import { computeBundleSavings } from "./compute-bundle-savings";
import { resolvePriceLabel } from "./format-brl-cents";
import {
  ADS_FREE_PLAN_IDS,
  BILLING_PLAN_DEFINITIONS,
} from "./plan-catalog";
import {
  isBillingPriceConfiguredViaEnv,
  resolveBillingPriceCents,
} from "./resolve-plan-prices";
import {
  DEFAULT_PLAY_PRICES_CENTS,
  PLAY_PRODUCT_SKU,
} from "./default-play-prices";
import { resolvePixGatewayConfig } from "./gateway/resolve-pix-gateway-config";
import { ADS_REMOVAL_CHECKOUT_ENABLED } from "./free-mode";
import type { BillingPlanView, BillingPlansResponse, PaidPlanId } from "./types";
import { TRIAL_DURATION_DAYS, TRIAL_PLAN_LABEL } from "@/lib/auth/trial/constants";

function buildPlanView(
  definition: (typeof BILLING_PLAN_DEFINITIONS)[number]
): BillingPlanView {
  if (definition.kind !== "paid") {
    return {
      ...definition,
      kind: "trial",
      id: "trial",
      priceCents: null,
      priceLabel: resolvePriceLabel(null),
      configured: false,
    };
  }

  const planId = definition.id as PaidPlanId;
  const priceCents = resolveBillingPriceCents(planId);

  return {
    ...definition,
    kind: "paid",
    id: planId,
    priceCents,
    priceLabel: resolvePriceLabel(priceCents),
    configured: isBillingPriceConfiguredViaEnv(planId),
  };
}

export function buildBillingPlansResponse(): BillingPlansResponse {
  const plans = BILLING_PLAN_DEFINITIONS.map(buildPlanView);
  const monthCents = resolveBillingPriceCents("month");
  const yearCents = resolveBillingPriceCents("year");
  const checkoutReady =
    ADS_REMOVAL_CHECKOUT_ENABLED && resolvePixGatewayConfig().checkoutReady;

  const playPrices: Partial<
    Record<PaidPlanId, { priceCents: number; priceLabel: string; sku: string }>
  > = {};
  for (const planId of ADS_FREE_PLAN_IDS) {
    const cents = DEFAULT_PLAY_PRICES_CENTS[planId];
    const sku = PLAY_PRODUCT_SKU[planId];
    if (cents != null && sku) {
      playPrices[planId] = {
        priceCents: cents,
        priceLabel: resolvePriceLabel(cents),
        sku,
      };
    }
  }

  return {
    ok: true,
    currency: "BRL",
    checkoutEnabled: checkoutReady,
    productModel: "ads_free",
    channels: {
      web: "pix",
      mobile: "play",
    },
    playPrices,
    trialPolicy: {
      durationDays: TRIAL_DURATION_DAYS,
      oncePerCpf: true,
      label: TRIAL_PLAN_LABEL,
    },
    plans,
    promo: null,
    quarterSavings: null,
    semesterSavings: null,
    yearSavings: computeBundleSavings(
      monthCents,
      12,
      yearCents,
      "doze mensalidades"
    ),
    fiveYearSavings: null,
  };
}
