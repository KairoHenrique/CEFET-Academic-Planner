export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { resolveCursoLabel } from "@/lib/auth/account/curso-catalog";
import { getActiveQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { postgresMapaQueryDeps } from "@/lib/db/postgres/query-port";
import {
  buildMapaGrafo,
  buildMapaGrafoFromQueries,
} from "@/lib/mapa/build-mapa-grafo";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const cursoId = getActiveQueryCursoId();
    const grafo = await buildMapaGrafoFromQueries(postgresMapaQueryDeps, {
      cursoLabel: cursoId ? resolveCursoLabel(cursoId) : undefined,
    });
    return apiSuccess(grafo);
  }

  return apiSuccess(buildMapaGrafo());
});
