export const dynamic = "force-dynamic";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { runSync } from "@/lib/sync/run-sync";
import { withSyncLock } from "@/lib/sync/sync-lock";
import { recordSyncCompletedAt } from "@/lib/sync/sync-preferences";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
/** Turma virtual live pode levar ~5 min (várias disciplinas × subpáginas). */
export const maxDuration = 360;

export const POST = withDb(async (request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);
    const result = await withSyncLock(() => runSync(credentials));
    recordSyncCompletedAt();

    return apiSuccess({
      ok: true as const,
      steps: result.steps,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
});
