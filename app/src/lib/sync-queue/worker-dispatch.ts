import type { WorkerJobResult } from "@/lib/worker/job-types";
import type { SyncQueueJobRecord } from "@/lib/sync-queue/types";
import { openQueuePassword } from "@/lib/sync-queue/queue-credential-seal";
import { runSync } from "@/lib/sync/run-sync";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";

export interface WorkerDispatchConfig {
  workerUrl: string;
  workerSecret: string;
}

export function resolveWorkerDispatchConfig(): WorkerDispatchConfig | null {
  const workerUrl = process.env.SIGAA_WORKER_URL?.trim();
  const workerSecret = process.env.WORKER_SHARED_SECRET?.trim();

  if (!workerUrl || !workerSecret) {
    return null;
  }

  return { workerUrl: workerUrl.replace(/\/$/, ""), workerSecret };
}

export async function dispatchJobToWorker(
  config: WorkerDispatchConfig,
  job: SyncQueueJobRecord
): Promise<WorkerJobResult> {
  const response = await fetch(`${config.workerUrl}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.workerSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId: job.id,
      robot: "r1",
      username: job.username,
      passwordEnc: job.passwordEnc,
      mode: job.mode,
      savePassword: job.savePassword === 1,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return {
      jobId: job.id,
      status: "failed",
      durationMs: 0,
      error: {
        code: "WORKER_HTTP_ERROR",
        message: message || `Worker respondeu ${response.status}.`,
      },
    };
  }

  const payload = (await response.json()) as WorkerJobResult;
  return payload;
}

export async function dispatchJobInline(
  job: SyncQueueJobRecord
): Promise<WorkerJobResult> {
  const password = openQueuePassword(job.passwordEnc);
  const startedAt = Date.now();

  try {
    const pipeline = await runWithSyncTenantContext(job.username, () =>
      runWithUserDb(job.username, () => {
        ensureDbReady();
        return runSync(
          {
            username: job.username,
            password,
            savePassword: job.savePassword === 1,
            mode: job.mode,
          },
          { mode: job.mode }
        );
      })
    );

    return {
      jobId: job.id,
      status: "completed",
      durationMs: Date.now() - startedAt,
      partial: pipeline.partial || undefined,
      steps: pipeline.steps,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha no sync inline.";
    return {
      jobId: job.id,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: {
        code: "WORKER_JOB_FAILED",
        message,
      },
    };
  }
}
