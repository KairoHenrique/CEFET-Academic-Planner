export type AbsenceZone = "safe" | "warning" | "danger";

export interface AbsenceRisk {
  label: string;
  badgeClass: "success" | "warning" | "danger";
  zone: AbsenceZone;
  ratio: number;
}

export function computeAbsenceRisk(
  current: number,
  max: number
): AbsenceRisk {
  const ratio = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  if (max > 0 && current >= max) {
    return {
      label: "Reprovado por falta",
      badgeClass: "danger",
      zone: "danger",
      ratio,
    };
  }

  if (max > 0 && current / max >= 0.8) {
    return { label: "Crítico", badgeClass: "danger", zone: "danger", ratio };
  }
  if (max > 0 && current / max >= 0.5) {
    return { label: "Atenção", badgeClass: "warning", zone: "warning", ratio };
  }
  return { label: "Seguro", badgeClass: "success", zone: "safe", ratio };
}
