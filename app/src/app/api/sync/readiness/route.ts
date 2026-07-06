export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { validationError } from "@/lib/api/errors";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { evaluateSyncReadiness } from "@/lib/sync/sync-readiness";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  try {
    const username = new URL(request.url).searchParams.get("username")?.trim();
    if (!username) {
      throw validationError("Informe o usuário do SIGAA.");
    }

    return await runWithScraperSqlite(() =>
      runWithUserDb(username, async () => {
        ensureDbReady();
        const readiness = evaluateSyncReadiness(username);

        return apiSuccess({
          ok: true as const,
          ...readiness,
        });
      })
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
};
