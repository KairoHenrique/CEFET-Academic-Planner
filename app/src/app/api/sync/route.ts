export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runQueuedSync } from "@/lib/sync-queue/run-queued-sync";
import { evaluateSyncReadiness } from "@/lib/sync/sync-readiness";
import { resolveSyncTrigger } from "@/lib/sync/resolve-sync-trigger";
import { buildPostgresSyncStubResponse } from "@/lib/sync/postgres-sync-stub";
import {
  isCloudSyncWorkerConfigured,
  runCloudSyncDirect,
} from "@/lib/sync-queue/cloud-sync-queue";

export const runtime = "nodejs";
/** Turma virtual live pode levar ~5 min (várias disciplinas × subpáginas). */
export const maxDuration = 360;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);
    const mode = credentials.mode ?? "full";

    // Cloud (Cloudflare): sem Playwright/fs — dispatch síncrono ao worker
    // hospedado (B72e). Sem worker configurado, mantém o stub informativo.
    // Local/worker Node em modo postgres: staging SQLite liberado + mirror (B72d).
    if (isCloudDeployment()) {
      if (!isCloudSyncWorkerConfigured()) {
        return buildPostgresSyncStubResponse();
      }

      const result = await runCloudSyncDirect({
        username: credentials.username,
        password: credentials.password || undefined,
        mode,
      });

      return apiSuccess({
        ok: true as const,
        steps: result.steps,
        partial: result.partial || undefined,
        jobId: result.jobId,
      });
    }

    return await runWithScraperSqlite(() =>
      runWithUserDb(credentials.username, async () => {
        ensureDbReady();

        const readiness = evaluateSyncReadiness(credentials.username);
        const trigger = resolveSyncTrigger({
          trigger: credentials.trigger,
          mode,
          canFastLogin: readiness.canFastLogin,
        });

        const result = await runQueuedSync({
          username: credentials.username,
          password: credentials.password || undefined,
          savePassword: credentials.savePassword,
          mode,
          trigger,
        });

        const steps = result.job.result?.steps ?? [];
        const partial = result.job.result?.partial;

        return apiSuccess({
          ok: true as const,
          steps,
          partial: partial || undefined,
          jobId: result.job.jobId,
        });
      })
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
