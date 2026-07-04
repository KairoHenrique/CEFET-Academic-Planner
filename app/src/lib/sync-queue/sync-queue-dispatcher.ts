import {
  dequeueNextSyncJob,
  findRunningSyncJob,
  markSyncJobCompleted,
  markSyncJobFailed,
  markSyncJobRunning,
} from "@/lib/sync-queue/sync-queue-store";
import type { SyncQueueJobRecord } from "@/lib/sync-queue/types";
import type { WorkerJobResult } from "@/lib/worker/job-types";
import {
  dispatchJobInline,
  dispatchJobToWorker,
  resolveWorkerDispatchConfig,
} from "@/lib/sync-queue/worker-dispatch";

let dispatchLoopActive = false;
let dispatchHandlerOverride:
  | ((job: SyncQueueJobRecord) => Promise<WorkerJobResult>)
  | null = null;

export function setSyncQueueDispatchHandlerForTests(
  handler: ((job: SyncQueueJobRecord) => Promise<WorkerJobResult>) | null
): void {
  dispatchHandlerOverride = handler;
}

function shouldUseInlineDispatch(): boolean {
  if (process.env.SYNC_QUEUE_DISPATCH?.trim() === "inline") {
    return true;
  }

  return resolveWorkerDispatchConfig() === null;
}

async function executeQueuedJob(): Promise<void> {
  const running = findRunningSyncJob();
  if (running) return;

  const next = dequeueNextSyncJob();
  if (!next) return;

  const startedAt = new Date().toISOString();
  markSyncJobRunning(next.id, startedAt);

  const workerConfig = resolveWorkerDispatchConfig();
  const result = dispatchHandlerOverride
    ? await dispatchHandlerOverride(next)
    : workerConfig && !shouldUseInlineDispatch()
      ? await dispatchJobToWorker(workerConfig, next)
      : await dispatchJobInline(next);

  const finishedAt = new Date().toISOString();

  if (result.status === "completed") {
    markSyncJobCompleted(
      next.id,
      finishedAt,
      JSON.stringify({
        steps: result.steps,
        partial: result.partial,
      })
    );
    return;
  }

  markSyncJobFailed(
    next.id,
    finishedAt,
    result.error?.code ?? "WORKER_JOB_FAILED",
    result.error?.message ?? "Falha no worker de sync."
  );
}

export function kickSyncQueueDispatcher(): void {
  if (dispatchLoopActive) return;

  dispatchLoopActive = true;
  void (async () => {
    try {
      while (!findRunningSyncJob() && dequeueNextSyncJob()) {
        await executeQueuedJob();
      }
    } finally {
      dispatchLoopActive = false;
      if (!findRunningSyncJob() && dequeueNextSyncJob()) {
        kickSyncQueueDispatcher();
      }
    }
  })();
}

export function isSyncQueueDispatcherActive(): boolean {
  return dispatchLoopActive;
}

/** Test hook — aguarda loop atual terminar. */
export async function awaitSyncQueueDispatcherIdle(): Promise<void> {
  while (dispatchLoopActive) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
