import {
  dequeueNextSyncJob,
  findRunningSyncJob,
  listRunningSyncJobs,
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
import { clearSigaaPasswordEnc } from "@/lib/auth/account/profile-repository";

let dispatchLoopActive = false;
let activeDispatchJobs = 0;
let dispatchHandlerOverride:
  | ((job: SyncQueueJobRecord) => Promise<WorkerJobResult>)
  | null = null;

const DEFAULT_MAX_CONCURRENT = 1;

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

let configuredMaxConcurrent = DEFAULT_MAX_CONCURRENT;

async function executeQueuedJob(job: SyncQueueJobRecord): Promise<void> {
  const startedAt = new Date().toISOString();
  markSyncJobRunning(job.id, startedAt);

  const workerConfig = resolveWorkerDispatchConfig();
  const result = dispatchHandlerOverride
    ? await dispatchHandlerOverride(job)
    : workerConfig && !shouldUseInlineDispatch()
      ? await dispatchJobToWorker(workerConfig, job)
      : await dispatchJobInline(job);

  const finishedAt = new Date().toISOString();

  if (result.status === "completed") {
    markSyncJobCompleted(
      job.id,
      finishedAt,
      JSON.stringify({
        steps: result.steps,
        partial: result.partial,
      })
    );
    return;
  }

  const errorCode = result.error?.code ?? "WORKER_JOB_FAILED";

  if (errorCode === "INVALID_CREDENTIALS") {
    await clearSigaaPasswordEnc(job.username).catch((e) =>
      console.error("[dispatcher] Erro ao limpar senha:", e)
    );
  }

  markSyncJobFailed(
    job.id,
    finishedAt,
    errorCode,
    result.error?.message ?? "Falha no worker de sync."
  );
}

function runQueuedJob(job: SyncQueueJobRecord): void {
  activeDispatchJobs += 1;
  void executeQueuedJob(job)
    .catch(() => undefined)
    .finally(() => {
      activeDispatchJobs -= 1;
      kickSyncQueueDispatcher(configuredMaxConcurrent);
    });
}

export function kickSyncQueueDispatcher(
  maxConcurrent = configuredMaxConcurrent
): void {
  configuredMaxConcurrent = Math.max(1, Math.min(5, maxConcurrent));
  const limit = configuredMaxConcurrent;

  while (listRunningSyncJobs().length + activeDispatchJobs < limit) {
    const next = dequeueNextSyncJob(limit);
    if (!next) break;
    runQueuedJob(next);
  }

  if (dispatchLoopActive) return;
  dispatchLoopActive = true;

  void (async () => {
    try {
      while (listRunningSyncJobs().length + activeDispatchJobs > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } finally {
      dispatchLoopActive = false;
      if (dequeueNextSyncJob(limit)) {
        kickSyncQueueDispatcher(limit);
      }
    }
  })();
}

export function isSyncQueueDispatcherActive(): boolean {
  return dispatchLoopActive || activeDispatchJobs > 0;
}

/** Test hook — aguarda loop atual terminar. */
export async function awaitSyncQueueDispatcherIdle(): Promise<void> {
  while (isSyncQueueDispatcherActive()) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** @deprecated use listRunningSyncJobs — mantido para compat. */
export { findRunningSyncJob };
