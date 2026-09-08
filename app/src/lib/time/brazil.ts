/**
 * Datas no fuso America/Sao_Paulo (BRT/BRST).
 */

const BRAZIL_TZ = "America/Sao_Paulo";

/** Retorna `YYYY-MM-DD` no calendário de Brasília. */
export function toBrazilIsoDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getBrazilTimeZone(): string {
  return BRAZIL_TZ;
}
