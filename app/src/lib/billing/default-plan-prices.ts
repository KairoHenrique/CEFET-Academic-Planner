import type { PaidPlanId } from "./types";

/** Preços base v1 (centavos BRL) — sobrescritos por `BILLING_PRICE_*` no env. */
export const DEFAULT_BILLING_PRICES_CENTS: Readonly<Record<PaidPlanId, number>> = {
  month: 3000,
  quarter: 5000,
  semester: 8500,
  year: 15000,
  five_year: 70000,
};
