import { buildSubjectListItem } from "@/lib/disciplinas/build-subject";
import { subjectMatchesDisciplinaFilter } from "@/lib/disciplinas/list-filters";
import type {
  DisciplinaListFilter,
  DisciplinaListResponse,
  SubjectListItem,
} from "@/lib/types/disciplinas-api";
import type { SemestreAtualWithDisciplina } from "@/lib/types/db";

function matchesSearch(item: SubjectListItem, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
}

export async function buildDisciplinaListFromQueries(
  getSemestreAtual: () => Promise<SemestreAtualWithDisciplina[]>,
  query = "",
  filter: DisciplinaListFilter = "todas"
): Promise<DisciplinaListResponse> {
  const items = (await getSemestreAtual())
    .map(buildSubjectListItem)
    .filter(
      (item) =>
        matchesSearch(item, query) &&
        subjectMatchesDisciplinaFilter(item, filter)
    );

  return { items };
}
