export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runSync } from "@/lib/sync/run-sync";
import { withSyncLock } from "@/lib/sync/sync-lock";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
/** Turma virtual live pode levar ~5 min (várias disciplinas × subpáginas). */
export const maxDuration = 360;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);

    return await runWithUserDb(credentials.username, async () => {
      ensureDbReady();
      const result = await withSyncLock(() =>
        runSync(credentials, { mode: credentials.mode ?? "full" })
      );

      return apiSuccess({
        ok: true as const,
        steps: result.steps,
        partial: result.partial || undefined,
      });
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
