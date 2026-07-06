import { computeBundleSavings } from "./compute-bundle-savings";
import { resolvePriceLabel } from "./format-brl-cents";
import { BILLING_PLAN_DEFINITIONS } from "./plan-catalog";
import {
  isBillingPriceConfiguredViaEnv,
  resolveBillingPriceCents,
} from "./resolve-plan-prices";
import { resolvePixGatewayConfig } from "./gateway/resolve-pix-gateway-config";
import type { BillingPlanView, BillingPlansResponse, PaidPlanId } from "./types";
import { TRIAL_DURATION_DAYS, TRIAL_PLAN_LABEL } from "@/lib/auth/trial/constants";

function buildPlanView(
  definition: (typeof BILLING_PLAN_DEFINITIONS)[number]
): BillingPlanView {
  if (definition.kind !== "paid") {
    return {
      ...definition,
      priceCents: null,
      priceLabel: resolvePriceLabel(null),
      configured: false,
    };
  }

  const planId = definition.id as PaidPlanId;
  const priceCents = resolveBillingPriceCents(planId);

  return {
    ...definition,
    priceCents,
    priceLabel: resolvePriceLabel(priceCents),
    configured: isBillingPriceConfiguredViaEnv(planId),
  };
}

export function buildBillingPlansResponse(): BillingPlansResponse {
  const plans = BILLING_PLAN_DEFINITIONS.map(buildPlanView);
  const monthCents = resolveBillingPriceCents("month");
  const quarterCents = resolveBillingPriceCents("quarter");
  const semesterCents = resolveBillingPriceCents("semester");
  const yearCents = resolveBillingPriceCents("year");
  const fiveYearCents = resolveBillingPriceCents("five_year");

  return {
    ok: true,
    currency: "BRL",
    checkoutEnabled: resolvePixGatewayConfig().checkoutReady,
    trialPolicy: {
      durationDays: TRIAL_DURATION_DAYS,
      oncePerCpf: true,
      label: TRIAL_PLAN_LABEL,
    },
    plans,
    quarterSavings: computeBundleSavings(
      monthCents,
      3,
      quarterCents,
      "3 mensais"
    ),
    semesterSavings: computeBundleSavings(
      quarterCents,
      2,
      semesterCents,
      "2 trimestres"
    ),
    yearSavings: computeBundleSavings(
      semesterCents,
      2,
      yearCents,
      "2 semestres"
    ),
    fiveYearSavings: computeBundleSavings(
      yearCents,
      5,
      fiveYearCents,
      "5 anuais"
    ),
  };
}
