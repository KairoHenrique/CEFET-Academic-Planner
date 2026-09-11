import { ApiError } from "@/lib/api/errors";
import { getSyncQueueJobView } from "@/lib/sync-queue/to-sync-queue-job-view";
import type { SyncQueueJobView } from "@/lib/sync-queue/types";

const POLL_INTERVAL_MS = 400;

export async function waitForSyncJob(
  jobId: string,
  timeoutMs = 900_000
): Promise<SyncQueueJobView> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const job = getSyncQueueJobView(jobId);

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new ApiError(
        "INTERNAL_ERROR",
        job.error?.message ?? "Falha no sync enfileirado.",
        500
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new ApiError(
    "SIGAA_TIMEOUT",
    "Sync excedeu o tempo limite aguardando a fila.",
    504
  );
}
