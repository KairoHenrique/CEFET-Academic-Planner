export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  buildTurmasOfertadasResponse,
  buildTurmasOfertadasResponseAsync,
} from "@/lib/turmas-ofertadas/build-turmas-ofertadas-response";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    return apiSuccess(await buildTurmasOfertadasResponseAsync());
  }

  return apiSuccess(buildTurmasOfertadasResponse());
});
