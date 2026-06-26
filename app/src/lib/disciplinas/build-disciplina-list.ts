import { getSemestreAtual } from "@/lib/db/queries";
import type {
  DisciplinaListFilter,
  DisciplinaListResponse,
  SubjectListItem,
} from "@/lib/types/disciplinas-api";
import { buildSubjectListItem } from "./build-subject";
import { subjectMatchesDisciplinaFilter } from "./list-filters";

function matchesSearch(item: SubjectListItem, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
}

export function buildDisciplinaList(
  query = "",
  filter: DisciplinaListFilter = "todas"
): DisciplinaListResponse {
  const items = getSemestreAtual()
    .map(buildSubjectListItem)
    .filter(
      (item) =>
        matchesSearch(item, query) &&
        subjectMatchesDisciplinaFilter(item, filter)
    );

  return { items };
}
