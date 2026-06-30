/**
 * Arredondamento da nota final (soma das avaliações).
 * Decimal >= 0,5 → inteiro superior (31,6 → 32). Decimal < 0,5 → mantém uma casa (31,4 → 31,4).
 */
export function roundFinalGradeTotal(rawTotal: number): number {
  if (!Number.isFinite(rawTotal)) return 0;

  const sign = rawTotal < 0 ? -1 : 1;
  const total = Math.abs(rawTotal);
  const integerPart = Math.floor(total);
  const fractionalPart = total - integerPart;

  if (fractionalPart >= 0.5) {
    return sign * Math.ceil(total);
  }

  return sign * (Math.round(total * 10) / 10);
}
