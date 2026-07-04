import { ApiError } from "@/lib/api/errors";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runSync } from "@/lib/sync/run-sync";
import type { BrowserJobSlot } from "@/lib/worker/browser-job-slot";
import type {
  WorkerJobFailure,
  WorkerJobRequest,
  WorkerJobResult,
} from "@/lib/worker/job-types";
import type { WorkerRuntimeState } from "@/lib/worker/worker-runtime-state";

function mapJobError(error: unknown): WorkerJobFailure["error"] {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    return { code: "WORKER_JOB_FAILED", message: error.message };
  }

  return {
    code: "WORKER_JOB_FAILED",
    message: "Falha desconhecida no job de sync.",
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  jobId: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Job ${jobId} excedeu o timeout de ${Math.round(timeoutMs / 1000)}s.`
        )
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function runWorkerSyncJob(
  request: WorkerJobRequest,
  slot: BrowserJobSlot,
  runtime: WorkerRuntimeState,
  jobTimeoutMs: number
): Promise<WorkerJobResult> {
  const startedAt = Date.now();

  runtime.beginJob(request.jobId);

  try {
    const pipeline = await slot.run(() =>
      withTimeout(
        runWithUserDb(request.username, () => {
          ensureDbReady();
          return runSync(
            {
              username: request.username,
              password: request.password,
              savePassword: request.savePassword,
              mode: request.mode,
            },
            { mode: request.mode ?? "full" }
          );
        }),
        jobTimeoutMs,
        request.jobId
      )
    );

    return {
      jobId: request.jobId,
      status: "completed",
      durationMs: Date.now() - startedAt,
      partial: pipeline.partial || undefined,
      steps: pipeline.steps,
    };
  } catch (error) {
    return {
      jobId: request.jobId,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: mapJobError(error),
    };
  } finally {
    runtime.endJob();
  }
}
