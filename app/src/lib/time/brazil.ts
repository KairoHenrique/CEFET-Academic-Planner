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

/**
 * Converte data+hora de parede em Brasília para um `Date` UTC absoluto.
 * `isoDate` = YYYY-MM-DD, `time` = HH:mm.
 */
export function brazilWallTimeToUtcDate(isoDate: string, time = "23:59"): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const y = year || 1970;
  const m = (month || 1) - 1;
  const d = day || 1;
  const hh = Number.isFinite(hours) ? hours : 23;
  const mm = Number.isFinite(minutes) ? minutes : 59;

  // Interpreta componentes como horário de Brasília via offset aproximado:
  // formata um instante candidato e ajusta até bater o wall-clock BRT.
  let guess = Date.UTC(y, m, d, hh + 3, mm, 0, 0);
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BRAZIL_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));

    const gy = Number(parts.find((p) => p.type === "year")?.value ?? y);
    const gm = Number(parts.find((p) => p.type === "month")?.value ?? m + 1);
    const gd = Number(parts.find((p) => p.type === "day")?.value ?? d);
    const gh = Number(parts.find((p) => p.type === "hour")?.value ?? hh);
    const gmin = Number(parts.find((p) => p.type === "minute")?.value ?? mm);

    const want = Date.UTC(y, m, d, hh, mm);
    const got = Date.UTC(gy, gm - 1, gd, gh, gmin);
    const delta = want - got;
    if (delta === 0) break;
    guess += delta;
  }

  return new Date(guess);
}
