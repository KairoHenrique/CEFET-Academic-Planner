export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { getSyncQueueJobView } from "@/lib/sync-queue/to-sync-queue-job-view";

export const runtime = "nodejs";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) => {
  try {
    const { jobId } = await context.params;
    const job = getSyncQueueJobView(jobId.trim());

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
