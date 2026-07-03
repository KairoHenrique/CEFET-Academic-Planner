/** Segunda=0 … Domingo=6 (mesmo índice de isoDateToWeekdayIndex). */
export const WEEKDAY_PICKER_OPTIONS = [
  { index: 0, short: "S", label: "Segunda-feira" },
  { index: 1, short: "T", label: "Terça-feira" },
  { index: 2, short: "Q", label: "Quarta-feira" },
  { index: 3, short: "Q", label: "Quinta-feira" },
  { index: 4, short: "S", label: "Sexta-feira" },
  { index: 5, short: "S", label: "Sábado" },
  { index: 6, short: "D", label: "Domingo" },
] as const;

export type WeekdayIndex = (typeof WEEKDAY_PICKER_OPTIONS)[number]["index"];

export function serializeRecurrenceDays(days: number[]): string {
  return [...new Set(days)]
    .filter((day) => day >= 0 && day <= 6)
    .sort((left, right) => left - right)
    .join(",");
}

export function parseRecurrenceDays(raw: string | null | undefined): WeekdayIndex[] {
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((day): day is WeekdayIndex => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function parseRecurrenceDaysInput(value: unknown): WeekdayIndex[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value)]
    .map((item) => Number(item))
    .filter((day): day is WeekdayIndex => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right);
}

export function formatRecurrenceDaysShort(raw: string | null | undefined): string {
  const labels = new Map(WEEKDAY_PICKER_OPTIONS.map((option) => [option.index, option.label]));
  const names = parseRecurrenceDays(raw).map((day) => labels.get(day)?.slice(0, 3) ?? "");

  if (names.length === 0) return "";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function toggleRecurrenceDay(
  days: WeekdayIndex[],
  day: WeekdayIndex
): WeekdayIndex[] {
  return days.includes(day)
    ? days.filter((value) => value !== day)
    : [...days, day].sort((left, right) => left - right);
}
