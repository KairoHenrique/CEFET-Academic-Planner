import type {
  DisciplinaListFilter,
  SubjectListItem,
} from "@/lib/types/disciplinas-api";

export const DISCIPLINA_FILTER_LABELS = [
  "Todas",
  "Com tarefas",
  "Risco de faltas",
  "Risco",
  "Crítico",
  "Aprovados",
] as const;

export type DisciplinaFilterLabel = (typeof DISCIPLINA_FILTER_LABELS)[number];

export const LABEL_TO_DISCIPLINA_FILTER: Record<
  DisciplinaFilterLabel,
  DisciplinaListFilter
> = {
  Todas: "todas",
  "Com tarefas": "com_tarefas",
  "Risco de faltas": "risco_faltas",
  Risco: "risco",
  Crítico: "critico",
  Aprovados: "aprovados",
};

export function resolveDisciplinaFilterLabel(
  label: string
): DisciplinaListFilter {
  return (
    LABEL_TO_DISCIPLINA_FILTER[label as DisciplinaFilterLabel] ?? "todas"
  );
}

export function subjectMatchesDisciplinaFilter(
  item: SubjectListItem,
  filter: DisciplinaListFilter
): boolean {
  if (filter === "todas") return true;
  if (filter === "com_tarefas") return item.tasks > 0;
  if (filter === "risco_faltas") {
    return item.maxAbsences > 0 && item.absences / item.maxAbsences >= 0.5;
  }
  if (filter === "risco") return item.gradeRisk.label === "Risco";
  if (filter === "critico") return item.gradeRisk.label === "Crítico";
  if (filter === "aprovados") return item.gradeRisk.label === "Aprovado";
  return true;
}
