export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { enqueueCloudSyncJob, isCloudSyncWorkerConfigured, runCloudSyncDirect } from "@/lib/sync-queue/cloud-sync-queue";
import { runTurmasSelecionadasSync } from "@/lib/sync/run-turmas-selecionadas-sync";
import type { TurmaSelecionadaItem } from "@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";
import { withSyncLock } from "@/lib/sync/sync-lock";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);

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
        password: credentials.password,
        mode: credentials.mode,
        robot: "turmas-selecionadas"
      });

      return apiSuccess({
        ok: true,
        turmas: (result.payload as TurmaSelecionadaItem[]) || [],
      });
    }

    return await runWithScraperSqlite(() =>
      runWithSyncTenantContext(credentials.username, () =>
        runWithUserDb(credentials.username, async () => {
          ensureDbReady();
          const result = await withSyncLock(() =>
            runTurmasSelecionadasSync(credentials)
          );

          return apiSuccess({
            ok: true,
            turmas: result,
          });
        })
      )
    );
  } catch (error) {
    return apiErrorResponse(error instanceof ApiError ? error : new Error(String(error)));
  }
};
