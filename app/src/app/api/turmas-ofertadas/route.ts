export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildTurmasOfertadasResponse } from "@/lib/turmas-ofertadas/build-turmas-ofertadas-response";

export const GET = withDb(async () => {
  return apiSuccess(buildTurmasOfertadasResponse());
});
