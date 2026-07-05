import { formatBrlCents } from "./format-brl-cents";
import type { BillingPlanSavings } from "./types";

export function computeBundleSavings(
  unitCents: number,
  units: number,
  bundleCents: number,
  compareLabel: string
): BillingPlanSavings | null {
  const fullPriceCents = unitCents * units;

  if (bundleCents >= fullPriceCents) {
    return { percent: 0, label: null };
  }

  const savingsCents = fullPriceCents - bundleCents;
  const percent = Math.round((savingsCents / fullPriceCents) * 100);

  if (percent <= 0) {
    return { percent: 0, label: null };
  }

  return {
    percent,
    label: `Economize ${formatBrlCents(savingsCents)} vs. ${compareLabel}`,
  };
}
