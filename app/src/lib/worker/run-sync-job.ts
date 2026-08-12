import { ApiError } from "@/lib/api/errors";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runCalendarioSync } from "@/lib/sync/run-calendario-sync";
import { runSync } from "@/lib/sync/run-sync";
import { runTurmasOfertadasSync } from "@/lib/sync/run-turmas-ofertadas-sync";
import { runTurmasSelecionadasSync } from "@/lib/sync/run-turmas-selecionadas-sync";
import { runSubmitTarefaJob } from "@/lib/task-submissions/run-submit-tarefa";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";
import type { BrowserJobSlot } from "@/lib/worker/browser-job-slot";
import type {
  WorkerJobFailure,
  WorkerJobRequest,
  WorkerJobResult,
} from "@/lib/worker/job-types";
import { resolveWorkerJobPassword } from "@/lib/worker/resolve-worker-password";
import type { WorkerRuntimeState } from "@/lib/worker/worker-runtime-state";

interface WorkerPipelineOutcome {
  partial: boolean;
  steps: Array<{ label: string; progress: number }>;
  payload?: unknown;
}

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

async function runRobotPipeline(
  request: WorkerJobRequest,
  password: string
): Promise<WorkerPipelineOutcome> {
  const credentials = {
    username: request.username,
    password,
    savePassword: request.savePassword,
    mode: request.mode,
  };

  if (request.robot === "turmas") {
    const result = await runTurmasOfertadasSync(credentials, { force: true });
    return {
      partial: result.partial,
      steps: [{ label: result.message, progress: 100 }],
    };
  }

  if (request.robot === "calendario") {
    const result = await runCalendarioSync(credentials, { force: true });
    return {
      partial: result.partial,
      steps: [{ label: result.message, progress: 100 }],
    };
  }

  if (request.robot === "turmas-selecionadas") {
    const turmas = await runTurmasSelecionadasSync(credentials);
    return {
      partial: false,
      steps: [{ label: "Turmas selecionadas sincronizadas", progress: 100 }],
      payload: turmas,
    };
  }

  if (request.robot === "submit-tarefa") {
    const submissionId = request.submissionId?.trim();
    if (!submissionId) {
      throw new Error("submissionId ausente no job submit-tarefa.");
    }
    const result = await runSubmitTarefaJob({
      username: request.username,
      password,
      submissionId,
    });
    return {
      partial: false,
      steps: [{ label: result.message, progress: 100 }],
      payload: { submissionId },
    };
  }

  const pipeline = await runSync(credentials, {
    mode: request.mode ?? "full",
  });
  return { partial: pipeline.partial, steps: pipeline.steps };
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
    const password = resolveWorkerJobPassword(request);
    // Staging SQLite + mirror PG: mesmo override ALS das rotas locais (B72d).
    // Sem isso, PLANNER_DATABASE=postgres no .env.local bloqueia o bootstrap.
    const pipeline = await slot.run(() =>
      withTimeout(
        runWithScraperSqlite(() =>
          runWithSyncTenantContext(request.username, () =>
            runWithUserDb(request.username, () => {
              ensureDbReady();
              return runRobotPipeline(request, password);
            })
          )
        ),
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
      payload: pipeline.payload,
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
