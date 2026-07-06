export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { buildCloudSyncQueueJobStubResponse } from "@/lib/sync/cloud-sync-queue-stub";
import {
  getCloudSyncJobView,
  isCloudSyncWorkerConfigured,
} from "@/lib/sync-queue/cloud-sync-queue";
import { getSyncQueueJobView } from "@/lib/sync-queue/to-sync-queue-job-view";

export const runtime = "nodejs";

export const GET = async (
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) => {
  try {
    const { jobId } = await context.params;

    if (isCloudDeployment()) {
      if (!isCloudSyncWorkerConfigured()) {
        return buildCloudSyncQueueJobStubResponse(jobId.trim());
      }

      const job = await getCloudSyncJobView(
        jobId.trim(),
        request.headers.get("X-Planner-Sigaa-User")
      );
      return apiSuccess({ ok: true as const, job });
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
