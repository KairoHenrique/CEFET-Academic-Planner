import type { PaidPlanId } from "./types";

/**
 * Precos Play Billing (centavos BRL) — liquido alinhado ao PIX.
 * Formula: play ≈ pix * 0.99 / 0.85 (taxa PIX ~1%, Play ~15%).
 * So month/year sao vendidos no produto ads_free; demais = legado.
 */
export const DEFAULT_PLAY_PRICES_CENTS: Readonly<
  Partial<Record<PaidPlanId, number>>
> = {
  month: 1190, // R$ 11,90
  year: 9390, // R$ 93,90
};

/** SKUs Google Play (configurar no Play Console com os mesmos IDs). */
export const PLAY_PRODUCT_SKU: Readonly<Partial<Record<PaidPlanId, string>>> = {
  month: "ads_free_month",
  year: "ads_free_year",
};
