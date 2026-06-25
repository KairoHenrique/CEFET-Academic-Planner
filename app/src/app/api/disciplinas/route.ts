import { apiSuccess } from "@/lib/api/response";
import { parseDisciplinaListParams } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { buildDisciplinaList } from "@/lib/disciplinas/build-disciplina-list";

export const GET = withDb(async (request) => {
  const { searchParams } = new URL(request.url);
  const { q, filter } = parseDisciplinaListParams(searchParams);
  const data = buildDisciplinaList(q, filter);
  return apiSuccess(data);
});
