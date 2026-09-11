import { ApiClientError, getSyncQueueJob } from "@/lib/api/client";
import type { SyncQueueJobView } from "@/lib/types/sync-queue-api";

const POLL_INTERVAL_MS = 800;
/** Alinhado ao job timeout do worker (15 min) — evita UI desistir cedo. */
const DEFAULT_TIMEOUT_MS = 900_000;

export interface PollSyncJobOptions {
  timeoutMs?: number;
  onUpdate?: (job: SyncQueueJobView) => void;
  signal?: AbortSignal;
  sigaaUsername?: string;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Polling cancelado.", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Polling cancelado.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function pollSyncJobUntilDone(
  jobId: string,
  options: PollSyncJobOptions = {}
): Promise<SyncQueueJobView> {
  const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  while (Date.now() < deadline) {
    const job = await getSyncQueueJob(jobId, options.sigaaUsername);
    options.onUpdate?.(job);

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new ApiClientError(
        job.error?.message ?? "Falha no sync enfileirado.",
        "INTERNAL_ERROR",
        500
      );
    }

    await sleep(POLL_INTERVAL_MS, options.signal);
  }

  throw new ApiClientError(
    "Sync excedeu o tempo limite aguardando a fila.",
    "SIGAA_TIMEOUT",
    504
  );
}
