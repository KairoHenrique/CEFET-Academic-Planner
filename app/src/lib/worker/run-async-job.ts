import { ApiError } from "@/lib/api/errors";
import { getMirrorPool, isSyncMirrorEnabled } from "@/lib/sync-mirror/mirror-config";
import {
  pgClaimSyncJob,
  pgCompleteSyncJob,
  pgFailSyncJob,
} from "@/lib/sync-queue/pg-sync-jobs-store";
import type { BrowserJobSlot } from "@/lib/worker/browser-job-slot";
import type { WorkerJobRequest } from "@/lib/worker/job-types";
import { runWorkerSyncJob } from "@/lib/worker/run-sync-job";
import type { WorkerRuntimeState } from "@/lib/worker/worker-runtime-state";

/**
 * Execução assíncrona (B72e): o worker responde 202 imediatamente e o job
 * roda em background, publicando status na fila Postgres (`sync_jobs`) que
 * o app cloud consulta via `GET /api/sync/queue/:id`.
 */

export function assertAsyncExecutionAvailable(): void {
  if (!isSyncMirrorEnabled()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Execução async exige DATABASE_URL + SYNC_MIRROR_POSTGRES=true no worker.",
      400
    );
  }
}

/** Envio SIGAA usa `task_submissions`, não a fila `sync_jobs`. */
export function assertSubmitTarefaAsyncAvailable(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Envio async exige DATABASE_URL no worker (Servidor ACME).",
      400
    );
  }
}

export function startSubmitTarefaAsyncJob(
  request: WorkerJobRequest,
  slot: BrowserJobSlot,
  runtime: WorkerRuntimeState,
  jobTimeoutMs: number
): void {
  void runWorkerSyncJob(request, slot, runtime, jobTimeoutMs)
    .then((result) => {
      if (result.status === "completed") {
        console.info(
          `[worker] submit-tarefa ${request.jobId} concluído em ${Math.round(result.durationMs / 1000)}s.`
        );
        return;
      }
      console.warn(
        `[worker] submit-tarefa ${request.jobId} falhou: ${result.error?.message ?? result.error?.code ?? "erro desconhecido"}.`
      );
    })
    .catch((error) => {
      console.error(
        `[worker] submit-tarefa ${request.jobId} erro fora do pipeline:`,
        error instanceof Error ? error.message : error
      );
    });
}

export function startWorkerAsyncJob(
  request: WorkerJobRequest,
  slot: BrowserJobSlot,
  runtime: WorkerRuntimeState,
  jobTimeoutMs: number
): void {
  void executeAsyncJob(request, slot, runtime, jobTimeoutMs).catch((error) => {
    console.error(
      `[worker] Job async ${request.jobId} falhou fora do pipeline:`,
      error instanceof Error ? error.message : error
    );
  });
}

async function executeAsyncJob(
  request: WorkerJobRequest,
  slot: BrowserJobSlot,
  runtime: WorkerRuntimeState,
  jobTimeoutMs: number
): Promise<void> {
  const pool = getMirrorPool();

  const claimed = await pgClaimSyncJob(pool, request.jobId);
  if (!claimed) {
    console.warn(
      `[worker] Job ${request.jobId} não estava 'queued' no Postgres — ignorado.`
    );
    return;
  }

  const result = await runWorkerSyncJob(request, slot, runtime, jobTimeoutMs);

  if (result.status === "completed") {
    await pgCompleteSyncJob(pool, request.jobId, {
      steps: result.steps,
      partial: result.partial,
    });
    console.info(
      `[worker] Job async ${request.jobId} concluído em ${Math.round(result.durationMs / 1000)}s.`
    );
    // Push pos-sync desligado (evita reenviar itens ja vistos).
    return;
  }

  await pgFailSyncJob(pool, request.jobId, result.error);
  console.warn(
    `[worker] Job async ${request.jobId} falhou: ${result.error.code}.`
  );
}
