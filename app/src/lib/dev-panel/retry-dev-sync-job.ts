import { ApiError, notFoundError, validationError } from "@/lib/api/errors";
import { isCloudDeployment } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  enqueueCloudSyncJob,
  isCloudSyncWorkerConfigured,
} from "@/lib/sync-queue/cloud-sync-queue";
import { pgFindSyncJobById } from "@/lib/sync-queue/pg-sync-jobs-store";
import type { DevSyncJobRetryResult } from "@/lib/dev-panel/types";

/**
 * Reprocessa um job de sync que falhou, re-enfileirando ao worker do PC.
 * A senha SIGAA selada é resolvida no dispatch (não trafega pelo painel).
 * Disponível apenas no deploy cloud (fila Postgres + worker).
 */
export async function retryDevSyncJob(
  jobId: string
): Promise<DevSyncJobRetryResult> {
  const normalizedId = jobId.trim();
  if (!normalizedId) {
    throw validationError("Informe o ID do job a reprocessar.");
  }

  if (!isCloudDeployment()) {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Retry disponível apenas no deploy cloud.",
      400
    );
  }
  if (!isCloudSyncWorkerConfigured()) {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Worker de sincronização não configurado no deploy.",
      503
    );
  }

  await ensurePostgresReady();

  const pool = getPostgresPool();
  const job = await pgFindSyncJobById(pool, normalizedId);
  if (!job) {
    throw notFoundError("Job de sync não encontrado.");
  }
  if (job.status !== "failed") {
    throw validationError("Só é possível reprocessar jobs com falha.");
  }

  const enqueued = await enqueueCloudSyncJob({
    username: job.username,
    mode: job.mode,
    lane: "priority",
    trigger: "manual",
    robot: job.robot,
  });

  return {
    ok: true,
    jobId: enqueued.job.jobId,
    reused: enqueued.reused,
    message: enqueued.reused
      ? "Já havia um job ativo para esta conta."
      : "Job reprocessado e enviado ao worker.",
  };
}
