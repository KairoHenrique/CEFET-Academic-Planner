export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import { kickSyncQueueDispatcher } from "@/lib/sync-queue/sync-queue-dispatcher";
import { parseEnqueueSyncQueueRequest } from "@/lib/sync-queue/validate-enqueue-request";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const input = parseEnqueueSyncQueueRequest(body);

    const result = await runWithUserDb(input.username, () => {
      ensureDbReady();
      return enqueueSyncJob(input);
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
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
