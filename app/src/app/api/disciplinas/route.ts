export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parseDisciplinaListParams } from "@/lib/api/validate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withDb } from "@/lib/api/with-db";
import { buildDisciplinaList } from "@/lib/disciplinas/build-disciplina-list";
import { buildDisciplinaListFromQueries } from "@/lib/disciplinas/build-disciplina-list-async";
import {
  pgGetAllFaltas,
  pgGetAllNotas,
  pgGetSemestreAtual,
  pgGetTarefas,
} from "@/lib/db/postgres/queries-read";

export const GET = withDb(async (request) => {
  const { searchParams } = new URL(request.url);
  const { q, filter } = parseDisciplinaListParams(searchParams);

  if (isPostgresBackend()) {
    const data = await buildDisciplinaListFromQueries(
      {
        getSemestreAtual: pgGetSemestreAtual,
        getAllNotas: pgGetAllNotas,
        getAllFaltas: pgGetAllFaltas,
        getTarefas: pgGetTarefas,
      },
      q,
      filter
    );
    return apiSuccess(data);
  }

  const data = buildDisciplinaList(q, filter);
  return apiSuccess(data);
});
