import { DEFAULT_BILLING_PRICES_CENTS } from "./default-plan-prices";
import type { PaidPlanId } from "./types";

const PRICE_ENV_KEYS: Record<PaidPlanId, string> = {
  quarter: "BILLING_PRICE_QUARTER_CENTS",
  semester: "BILLING_PRICE_SEMESTER_CENTS",
  year: "BILLING_PRICE_YEAR_CENTS",
  five_year: "BILLING_PRICE_FIVE_YEAR_CENTS",
};

function parsePositiveIntEnv(key: string): number | null {
  const raw = process.env[key]?.trim();
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function resolveBillingPriceCents(planId: PaidPlanId): number {
  const fromEnv = parsePositiveIntEnv(PRICE_ENV_KEYS[planId]);
  if (fromEnv != null) {
    return fromEnv;
  }

  return DEFAULT_BILLING_PRICES_CENTS[planId];
}

export function isBillingPriceConfiguredViaEnv(planId: PaidPlanId): boolean {
  return parsePositiveIntEnv(PRICE_ENV_KEYS[planId]) != null;
}
