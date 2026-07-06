export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { buildCloudSyncQueueStubResponse } from "@/lib/sync/cloud-sync-queue-stub";
import {
  enqueueCloudSyncJob,
  isCloudSyncWorkerConfigured,
  parseCloudEnqueueRequest,
} from "@/lib/sync-queue/cloud-sync-queue";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import { kickSyncQueueDispatcher } from "@/lib/sync-queue/sync-queue-dispatcher";
import { parseEnqueueSyncQueueRequest } from "@/lib/sync-queue/validate-enqueue-request";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    // Cloudflare: fila Postgres + dispatch ao worker hospedado (B72e).
    // Sem worker configurado, mantém o stub informativo.
    if (isCloudDeployment()) {
      if (!isCloudSyncWorkerConfigured()) {
        return buildCloudSyncQueueStubResponse();
      }

      const input = parseCloudEnqueueRequest(await request.json());
      const result = await enqueueCloudSyncJob(input);

      return apiSuccess(
        { ok: true as const, reused: result.reused, job: result.job },
        result.reused ? 200 : 202
      );
    }

    const body = await request.json();
    const input = parseEnqueueSyncQueueRequest(body);

    return await runWithScraperSqlite(async () => {
      const result = await runWithUserDb(input.username, async () => {
        ensureDbReady();
        return await enqueueSyncJob(input);
      });

      if (!result.reused) {
        kickSyncQueueDispatcher();
      }

      return apiSuccess(
        {
          ok: true as const,
          reused: result.reused,
          job: result.job,
        },
        result.reused ? 200 : 202
      );
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
