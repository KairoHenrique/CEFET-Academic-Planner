export function formatPeriodLabel(period: number): string {
  if (period <= 0) {
    return "Optativas / Eletivas";
  }

  return `${period}º período`;
}
