import { getSemestreAtual } from "@/lib/db/queries";
import type {
  DisciplinaListFilter,
  DisciplinaListResponse,
  SubjectListItem,
} from "@/lib/types/disciplinas-api";
import { buildSubjectListItem } from "./build-subject";

function matchesSearch(item: SubjectListItem, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
}

function matchesFilter(
  item: SubjectListItem,
  filter: DisciplinaListFilter
): boolean {
  if (filter === "todas") return true;
  if (filter === "com_tarefas") return item.tasks > 0;
  if (filter === "risco_faltas") {
    return item.absences / item.maxAbsences >= 0.5;
  }
  return true;
}

export function buildDisciplinaList(
  query = "",
  filter: DisciplinaListFilter = "todas"
): DisciplinaListResponse {
  const items = getSemestreAtual()
    .map(buildSubjectListItem)
    .filter(
      (item) => matchesSearch(item, query) && matchesFilter(item, filter)
    );

  return { items };
}
