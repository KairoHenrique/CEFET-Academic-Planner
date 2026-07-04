import { notFoundError } from "@/lib/api/errors";
import {
  computeQueuePosition,
  estimateQueueEtaSeconds,
} from "@/lib/sync-queue/estimate-queue-eta";
import { findSyncJobById } from "@/lib/sync-queue/sync-queue-store";
import type { SyncQueueJobRecord, SyncQueueJobView } from "@/lib/sync-queue/types";

function parseResultJson(resultJson: string | null): SyncQueueJobView["result"] {
  if (!resultJson) return undefined;

  try {
    const parsed = JSON.parse(resultJson) as {
      steps?: Array<{ label: string; progress: number }>;
      partial?: boolean;
    };

    if (!Array.isArray(parsed.steps)) return undefined;
    return {
      steps: parsed.steps,
      partial: parsed.partial,
    };
  } catch {
    return undefined;
  }
}

export function toSyncQueueJobView(record: SyncQueueJobRecord): SyncQueueJobView {
  const view: SyncQueueJobView = {
    jobId: record.id,
    username: record.username,
    lane: record.lane,
    trigger: record.trigger,
    mode: record.mode,
    status: record.status,
    position: computeQueuePosition(record),
    etaSeconds: estimateQueueEtaSeconds(record),
    createdAt: record.createdAt,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
  };

  if (record.status === "completed") {
    view.result = parseResultJson(record.resultJson);
  }

  if (record.status === "failed" && record.errorCode) {
    view.error = {
      code: record.errorCode,
      message: record.errorMessage ?? "Falha no sync.",
    };
  }

  return view;
}

export function getSyncQueueJobView(jobId: string): SyncQueueJobView {
  const record = findSyncJobById(jobId);
  if (!record) {
    throw notFoundError("Job de sync não encontrado.");
  }

  return toSyncQueueJobView(record);
}
