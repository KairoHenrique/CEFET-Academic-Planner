import type { SyncQueueJobView } from "@/lib/types/sync-queue-api";

export function formatSyncIntervalLabel(intervalMinutes: number): string {
  if (intervalMinutes >= 60 && intervalMinutes % 60 === 0) {
    const hours = intervalMinutes / 60;
    return hours === 1 ? "1 h" : `${hours} h`;
  }

  return `${intervalMinutes} min`;
}

export function formatEtaSeconds(etaSeconds: number): string {
  if (etaSeconds <= 0) return "em instantes";
  if (etaSeconds < 60) return `~${etaSeconds}s`;

  const minutes = Math.ceil(etaSeconds / 60);
  return minutes === 1 ? "~1 min" : `~${minutes} min`;
}

export function formatQueueStatusHint(
  job: SyncQueueJobView | null,
  syncing: boolean
): string | null {
  if (!syncing || !job) return null;

  if (job.status === "queued") {
    const position =
      job.position > 0 ? `posição ${job.position}` : "aguardando";
    return `Na fila · ${position} · ${formatEtaSeconds(job.etaSeconds)}`;
  }

  if (job.status === "running") {
    return "Sincronizando dados do SIGAA…";
  }

  return null;
}

export function resolveQueueLane(
  trigger: SyncQueueJobView["trigger"] | "first_login" | "manual" | "auto"
): "priority" | "normal" {
  return trigger === "first_login" ? "priority" : "normal";
}
