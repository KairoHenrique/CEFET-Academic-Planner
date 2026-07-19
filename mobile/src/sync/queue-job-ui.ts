import type { SyncQueueJobView, SyncStep } from "@acme/api-contracts";

const PENDING_TARGET_PROGRESS = 92;
const PENDING_ESTIMATED_MS = 4 * 60 * 1000;

function isLiteMode(mode: string | undefined): boolean {
  return mode === "lite" || mode === "incremental";
}

function pendingLabelForProgress(
  progress: number,
  mode: string | undefined
): string {
  if (isLiteMode(mode)) {
    if (progress >= 72) return "Baixando notas e tarefas…";
    if (progress >= 48) return "Sincronizando turma virtual…";
    if (progress >= 28) return "Carregando portal do discente…";
    return "Autenticando no SIGAA…";
  }

  if (progress >= 78) return "Baixando histórico escolar…";
  if (progress >= 52) return "Baixando notas e faltas…";
  if (progress >= 38) return "Sincronizando turma virtual…";
  if (progress >= 22) return "Carregando portal do discente…";
  return "Autenticando no SIGAA…";
}

/** Espelho de `queueJobToUiStep` do site. */
export function queueJobToUiStep(job: SyncQueueJobView | null): SyncStep {
  if (!job) {
    return { label: "Iniciando sincronização…", progress: 5 };
  }

  if (job.status === "queued") {
    const position = job.position ?? 0;
    const progress = Math.min(22, 8 + Math.max(0, 14 - position * 3));
    const label =
      position > 0
        ? `Na fila · posição ${position}`
        : "Aguardando na fila…";
    return { label, progress };
  }

  if (job.status === "running") {
    const startedMs = job.startedAt ? Date.parse(job.startedAt) : Date.now();
    const elapsed = Math.max(0, Date.now() - startedMs);
    const progress = Math.min(
      PENDING_TARGET_PROGRESS,
      25 +
        Math.floor(
          (elapsed / PENDING_ESTIMATED_MS) * (PENDING_TARGET_PROGRESS - 25)
        )
    );
    return {
      label: pendingLabelForProgress(progress, job.mode),
      progress,
    };
  }

  if (job.status === "completed" && job.result?.steps?.length) {
    const lastStep = job.result.steps[job.result.steps.length - 1];
    return lastStep ?? { label: "Sincronização concluída.", progress: 100 };
  }

  if (job.status === "completed") {
    return { label: "Sincronização concluída.", progress: 100 };
  }

  if (job.status === "failed") {
    return {
      label: job.error?.message ?? "Falha na sincronização.",
      progress: 0,
    };
  }

  return { label: "Iniciando sincronização…", progress: 5 };
}
