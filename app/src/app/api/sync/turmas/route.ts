export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runTurmasOfertadasSync } from "@/lib/sync/run-turmas-ofertadas-sync";
import { withSyncLock } from "@/lib/sync/sync-lock";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);
    const force =
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).force === true;

    return await runWithUserDb(credentials.username, async () => {
      ensureDbReady();
      const result = await withSyncLock(() =>
        runTurmasOfertadasSync(credentials, { force })
      );

      return apiSuccess({
        ok: result.ok,
        skipped: result.skipped,
        partial: result.partial || undefined,
        usedExampleData: result.usedExampleData || undefined,
        rowsWritten: result.rowsWritten,
        message: result.message,
      });
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
