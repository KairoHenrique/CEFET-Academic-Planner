export const ELECTIVE_PERIOD_THRESHOLD = 0;

export function isElectivePeriod(period: number): boolean {
  return period <= ELECTIVE_PERIOD_THRESHOLD;
}

export function formatPeriodLabel(period: number): string {
  if (isElectivePeriod(period)) {
    return "Optativas / Eletivas";
  }

  return `${period}º período`;
}
