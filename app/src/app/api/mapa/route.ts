export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withDb } from "@/lib/api/with-db";
import { buildMapa, buildMapaFromQueries } from "@/lib/mapa/build-mapa";
import { resolveCursoLabel } from "@/lib/auth/account/curso-catalog";
import { getActiveQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { postgresMapaQueryDeps } from "@/lib/db/postgres/query-port";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const cursoId = getActiveQueryCursoId();
    const mapa = await buildMapaFromQueries(postgresMapaQueryDeps, {
      cursoLabel: cursoId ? resolveCursoLabel(cursoId) : undefined,
    });
    return apiSuccess(mapa);
  }

  const mapa = buildMapa();
  return apiSuccess(mapa);
});
