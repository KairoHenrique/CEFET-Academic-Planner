import {
  buildSubjectListItemsFromQueries,
  type SubjectBulkQueryDeps,
} from "@/lib/disciplinas/build-subject-source";
import { subjectMatchesDisciplinaFilter } from "@/lib/disciplinas/list-filters";
import type {
  DisciplinaListFilter,
  DisciplinaListResponse,
  SubjectListItem,
} from "@/lib/types/disciplinas-api";

function matchesSearch(item: SubjectListItem, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
}

export async function buildDisciplinaListFromQueries(
  deps: SubjectBulkQueryDeps,
  query = "",
  filter: DisciplinaListFilter = "todas"
): Promise<DisciplinaListResponse> {
  const items = (await buildSubjectListItemsFromQueries(deps)).filter(
    (item) =>
      matchesSearch(item, query) && subjectMatchesDisciplinaFilter(item, filter)
  );

  return { items };
}
