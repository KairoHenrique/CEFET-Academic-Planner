import type { GradeRisk, SubjectListItem } from "@acme/api-contracts";
import { gradeRiskLabel } from "./safe-text";

export const DISCIPLINA_FILTERS = [
  "Todas",
  "Com tarefas",
  "Risco de faltas",
  "Risco",
  "Crítico",
  "Aprovados",
] as const;

export type DisciplinaFilterLabel = (typeof DISCIPLINA_FILTERS)[number];

function riskLabel(item: SubjectListItem): string {
  return gradeRiskLabel(item.gradeRisk as GradeRisk | string | null);
}

/** Mesma lógica de `app/src/lib/disciplinas/list-filters.ts`. */
export function subjectMatchesFilter(
  item: SubjectListItem,
  filter: DisciplinaFilterLabel
): boolean {
  if (filter === "Todas") return true;
  if (filter === "Com tarefas") return item.tasks > 0;
  if (filter === "Risco de faltas") {
    return item.maxAbsences > 0 && item.absences / item.maxAbsences >= 0.5;
  }
  if (filter === "Risco") return riskLabel(item) === "Risco";
  if (filter === "Crítico") return riskLabel(item) === "Crítico";
  if (filter === "Aprovados") return riskLabel(item) === "Aprovado";
  return true;
}
