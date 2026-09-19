import type { PaidPlanId } from "./types";

/**
 * Precos PIX/web (centavos BRL) — plano sem propaganda.
 * month/year = produto atual; demais = legado (nao exibidos como compraveis).
 */
export const DEFAULT_BILLING_PRICES_CENTS: Readonly<Record<PaidPlanId, number>> = {
  month: 990, // R$ 9,90
  quarter: 5000,
  semester: 8500,
  year: 7990, // R$ 79,90
  five_year: 70000,
};
