export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withDb } from "@/lib/api/with-db";
import { buildDisciplinaDetail } from "@/lib/disciplinas/build-disciplina-detail";
import { buildDisciplinaDetailFromQueries } from "@/lib/disciplinas/build-disciplina-detail-async";
import { postgresDisciplinaDetailDeps } from "@/lib/db/postgres/disciplina-query-port";

type RouteContext = { params: Promise<{ code: string }> };

export const GET = withDb(async (_request, context: RouteContext) => {
  const { code } = await context.params;
  const decoded = decodeURIComponent(code);

  if (isPostgresBackend()) {
    const data = await buildDisciplinaDetailFromQueries(
      decoded,
      postgresDisciplinaDetailDeps
    );
    return apiSuccess(data);
  }

  const data = buildDisciplinaDetail(decoded);
  return apiSuccess(data);
});
