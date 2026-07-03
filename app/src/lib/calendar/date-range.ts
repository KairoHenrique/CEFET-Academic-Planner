/** Itera dias inclusive entre duas datas ISO (YYYY-MM-DD). */
export function* eachIsoDateInRange(
  startIso: string,
  endIso: string
): Generator<string> {
  const start = parseIsoDateUtc(startIso);
  const end = parseIsoDateUtc(endIso);
  if (!start || !end || start > end) return;

  const cursor = new Date(start);
  while (cursor <= end) {
    yield formatIsoDateUtc(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

export function countIsoDaysInclusive(startIso: string, endIso: string): number {
  let count = 0;
  for (const _day of eachIsoDateInRange(startIso, endIso)) {
    count += 1;
  }
  return count;
}

export function parseIsoDateUtc(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatIsoDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Seg=0 … Sex=4 (grade semanal). */
export function isoDateToWeekdayIndex(iso: string): number | null {
  const date = parseIsoDateUtc(iso);
  if (!date) return null;
  const day = date.getUTCDay();
  if (day === 0) return 6;
  return day - 1;
}
