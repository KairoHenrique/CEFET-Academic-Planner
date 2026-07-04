import type { SyncStep } from "@/lib/types/sync";
import type { SyncQueueJobView } from "@/lib/types/sync-queue-api";

const PENDING_TARGET_PROGRESS = 92;
const PENDING_ESTIMATED_MS = 4 * 60 * 1000;

function pendingLabelForProgress(progress: number): string {
  if (progress >= 78) return "Baixando histórico escolar…";
  if (progress >= 52) return "Baixando notas e faltas…";
  if (progress >= 38) return "Sincronizando turma virtual…";
  if (progress >= 22) return "Carregando portal do discente…";
  return "Autenticando no SIGAA…";
}

export function queueJobToUiStep(job: SyncQueueJobView): SyncStep {
  if (job.status === "queued") {
    const progress = Math.min(22, 8 + Math.max(0, 14 - job.position * 3));
    const label =
      job.position > 0
        ? `Na fila · posição ${job.position}`
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
          (elapsed / PENDING_ESTIMATED_MS) *
            (PENDING_TARGET_PROGRESS - 25)
        )
    );

    return { label: pendingLabelForProgress(progress), progress };
  }

  if (job.status === "completed" && job.result?.steps?.length) {
    const lastStep = job.result.steps[job.result.steps.length - 1];
    return lastStep ?? { label: "Sincronização concluída.", progress: 100 };
  }

  return { label: "Iniciando sincronização…", progress: 5 };
}
