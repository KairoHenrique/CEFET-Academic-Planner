import type { SyncQueueJobRecord } from "@/lib/sync-queue/types";
import { SYNC_QUEUE_DEFAULT_ETA_SECONDS } from "@/lib/sync-queue/types";
import { countQueuedJobsAhead } from "@/lib/sync-queue/sync-queue-store";

export function estimateQueueEtaSeconds(
  job: SyncQueueJobRecord,
  averageJobSeconds = SYNC_QUEUE_DEFAULT_ETA_SECONDS
): number {
  if (job.status === "completed" || job.status === "failed") {
    return 0;
  }

  if (job.status === "running") {
    return averageJobSeconds;
  }

  const ahead = countQueuedJobsAhead(job.id);
  const runningSlot = 1;
  return (ahead + runningSlot) * averageJobSeconds;
}

export function computeQueuePosition(job: SyncQueueJobRecord): number {
  if (job.status === "running") return 0;
  if (job.status === "completed" || job.status === "failed") return 0;
  return countQueuedJobsAhead(job.id) + 1;
}
