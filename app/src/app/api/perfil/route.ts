import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parsePatchPerfilBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { buildPerfil } from "@/lib/perfil/build-perfil";
import { saveSyncPreferences } from "@/lib/sync/sync-preferences";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const GET = withDb(async () => {
  return apiSuccess(buildPerfil());
});

export const PATCH = withDb(async (request) => {
  try {
    const body = parsePatchPerfilBody(await request.json());
    const current = buildPerfil();

    saveSyncPreferences({
      autoEnabled: body.syncAutoEnabled ?? current.sync.autoEnabled,
      intervalMinutes:
        body.syncIntervalMinutes ?? current.sync.intervalMinutes,
    });

    return apiSuccess(buildPerfil());
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
});
