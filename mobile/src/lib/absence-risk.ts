export type AbsenceZone = "safe" | "warning" | "danger";

export interface AbsenceRisk {
  label: string;
  zone: AbsenceZone;
  ratio: number;
}

/** Cópia de `app/src/lib/disciplinas/absence-risk.ts`. */
export function computeAbsenceRisk(
  current: number,
  max: number
): AbsenceRisk {
  const ratio = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  if (max > 0 && current > max) {
    return { label: "Reprovado por falta", zone: "danger", ratio };
  }
  if (max > 0 && current / max >= 0.8) {
    return { label: "Crítico", zone: "danger", ratio };
  }
  if (max > 0 && current / max >= 0.5) {
    return { label: "Atenção", zone: "warning", ratio };
  }
  return { label: "Seguro", zone: "safe", ratio };
}
