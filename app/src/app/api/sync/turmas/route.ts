export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import {
  enqueueCloudSyncJob,
  isCloudSyncWorkerConfigured,
  runCloudSyncDirect,
} from "@/lib/sync-queue/cloud-sync-queue";
import { runTurmasOfertadasSync } from "@/lib/sync/run-turmas-ofertadas-sync";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";
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

    // Cloud: o scraper (Playwright) não roda no Cloudflare. Enfileira o robô
    // `turmas` para o worker do PC, que raspa e espelha no Postgres. O client
    // aguarda a conclusão via `jobId` e refaz o fetch das turmas.
    if (isCloudDeployment()) {
      if (!isCloudSyncWorkerConfigured()) {
        throw new ApiError(
          "SIGAA_OFFLINE",
          "Sincronização indisponível: worker não configurado no deploy.",
          503
        );
      }

      const result = await runCloudSyncDirect({
        username: credentials.username,
        password: credentials.password || undefined,
        mode: credentials.mode || "deep",
        robot: "turmas",
      });

      return apiSuccess(
        {
          ok: true as const,
          cloud: false as const,
          rowsWritten: 0,
          message: "Sincronização de turmas concluída via notebook.",
        },
        200
      );
    }

    return await runWithScraperSqlite(() =>
      runWithSyncTenantContext(credentials.username, () =>
        runWithUserDb(credentials.username, async () => {
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
        })
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
