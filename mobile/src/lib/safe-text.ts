import type { GradeRisk } from "@acme/api-contracts";

/** Nunca retorna objeto — evita crash "Objects are not valid as a React child". */
export function asText(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

/** Aceita objeto da API (`{ label, zone, … }`) ou string legada. Nunca retorna objeto. */
export function gradeRiskLabel(
  risk: GradeRisk | string | null | undefined | unknown
): string {
  try {
    if (risk == null) return "—";
    if (typeof risk === "string") {
      const map: Record<string, string> = {
        seguro: "Seguro",
        atencao: "Atenção",
        critico: "Crítico",
        recuperacao: "Recuperação",
        reprovado: "Reprovado",
        sem_nota: "Sem nota",
        safe: "Seguro",
        warning: "Atenção",
        danger: "Crítico",
        unknown: "Sem nota",
      };
      return map[risk] ?? risk;
    }
    if (typeof risk === "object" && risk !== null && "label" in risk) {
      return asText((risk as { label?: unknown }).label);
    }
    return "—";
  } catch {
    return "—";
  }
}

export function categoryPercent(done: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((done / total) * 100);
}
