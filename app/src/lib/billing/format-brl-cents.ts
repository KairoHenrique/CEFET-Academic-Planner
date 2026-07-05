export const BILLING_PRICE_TBD_LABEL = "Preço em definição";

export function formatBrlCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function resolvePriceLabel(priceCents: number | null): string {
  if (priceCents == null) {
    return BILLING_PRICE_TBD_LABEL;
  }
  return formatBrlCents(priceCents);
}
