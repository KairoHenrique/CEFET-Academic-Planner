export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { buildCloudSyncQueueJobStubResponse } from "@/lib/sync/cloud-sync-queue-stub";
import { getSyncQueueJobView } from "@/lib/sync-queue/to-sync-queue-job-view";

export const runtime = "nodejs";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) => {
  try {
    const { jobId } = await context.params;

    if (isCloudDeployment()) {
      return buildCloudSyncQueueJobStubResponse(jobId.trim());
    }

    const job = runWithScraperSqlite(() => getSyncQueueJobView(jobId.trim()));

    return apiSuccess({
      ok: true as const,
      job,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
