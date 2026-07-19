import type { SyncQueueJobResponse } from "@acme/api-contracts";
import { ApiClientError, requestJson } from "../auth/api";
import { getSession } from "../auth/session";

export type TurmasOfertadasSyncResponse = {
  ok: boolean;
  skipped?: boolean;
  partial?: boolean;
  usedExampleData?: boolean;
  rowsWritten: number;
  message: string;
  cloud?: boolean;
  jobId?: string;
};

export type TurmasSyncUiState = {
  syncing: boolean;
  progress: number;
  stepLabel: string;
  error: string | null;
  lastMessage: string | null;
};

const POLL_MS = 800;
const TIMEOUT_MS = 360_000;

const PROGRESS_STEPS: Array<{ at: number; label: string; progress: number }> = [
  { at: 0, label: "Conectando ao SIGAA…", progress: 8 },
  { at: 2_000, label: "Abrindo turmas ofertadas…", progress: 28 },
  { at: 6_000, label: "Lendo ofertas do semestre…", progress: 55 },
  { at: 12_000, label: "Gravando turmas…", progress: 78 },
  { at: 20_000, label: "Quase lá…", progress: 92 },
];

async function pollJobUntilDone(jobId: string): Promise<void> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const response = await requestJson<SyncQueueJobResponse>(
      `/api/sync/queue/${encodeURIComponent(jobId)}`
    );
    if (response.job.status === "completed") return;
    if (response.job.status === "failed") {
      throw new ApiClientError(
        response.job.error?.message ?? "Falha no sync de turmas.",
        500,
        response.job.error?.code ?? "INTERNAL_ERROR"
      );
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new ApiClientError(
    "Sync de turmas excedeu o tempo limite.",
    504,
    "SIGAA_TIMEOUT"
  );
}

/**
 * Paridade com `useTurmasOfertadasSync` do site (cloud):
 * POST /api/sync/turmas → poll job se cloud → sem senha/escolha.
 */
export async function runTurmasOfertadasSync(options?: {
  force?: boolean;
  onProgress?: (progress: number, label: string) => void;
}): Promise<TurmasOfertadasSyncResponse> {
  const session = getSession();
  if (!session?.cpf) {
    throw new ApiClientError(
      "Faça login e sincronize com o SIGAA para buscar turmas.",
      401,
      "UNAUTHORIZED"
    );
  }

  const startedAt = Date.now();
  let progressTimer: ReturnType<typeof setInterval> | null = null;

  const tickProgress = () => {
    const elapsed = Date.now() - startedAt;
    let current = PROGRESS_STEPS[0]!;
    for (const step of PROGRESS_STEPS) {
      if (elapsed >= step.at) current = step;
    }
    options?.onProgress?.(current.progress, current.label);
  };

  tickProgress();
  progressTimer = setInterval(tickProgress, 400);

  try {
    const result = await requestJson<TurmasOfertadasSyncResponse>(
      "/api/sync/turmas",
      {
        method: "POST",
        body: JSON.stringify({
          username: session.cpf,
          mode: "incremental",
          force: options?.force === true,
        }),
      }
    );

    if (result.cloud && result.jobId) {
      options?.onProgress?.(88, "Aguardando worker…");
      await pollJobUntilDone(result.jobId);
    }

    options?.onProgress?.(100, "Concluído");
    return result;
  } finally {
    if (progressTimer) clearInterval(progressTimer);
  }
}
