import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api/errors";
import { sealQueuePassword } from "@/lib/sync-queue/queue-credential-seal";
import {
  findActiveJobByIdempotencyKey,
  findSyncJobById,
  getLatestManualEnqueueAt,
  insertSyncJob,
} from "@/lib/sync-queue/sync-queue-store";
import { toSyncQueueJobView } from "@/lib/sync-queue/to-sync-queue-job-view";
import type {
  EnqueueSyncJobInput,
  EnqueueSyncJobResult,
} from "@/lib/sync-queue/types";
import { SYNC_QUEUE_MANUAL_COOLDOWN_MS } from "@/lib/sync-queue/types";

function assertManualCooldown(username: string): void {
  const lastAt = getLatestManualEnqueueAt(username);
  if (!lastAt) return;

  const elapsed = Date.now() - Date.parse(lastAt);
  if (!Number.isFinite(elapsed)) return;

  if (elapsed < SYNC_QUEUE_MANUAL_COOLDOWN_MS) {
    const waitSeconds = Math.ceil(
      (SYNC_QUEUE_MANUAL_COOLDOWN_MS - elapsed) / 1000
    );
    throw new ApiError(
      "RATE_LIMITED",
      `Aguarde ${waitSeconds}s antes de enfileirar outro sync manual.`,
      429
    );
  }
}

export function enqueueSyncJob(input: EnqueueSyncJobInput): EnqueueSyncJobResult {
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = findActiveJobByIdempotencyKey(idempotencyKey);
    if (existing) {
      return {
        job: toSyncQueueJobView(existing),
        reused: true,
      };
    }
  }

  if (input.trigger === "manual") {
    assertManualCooldown(input.username);
  }

  const now = new Date().toISOString();
  const jobId = randomUUID();
  const mode = input.mode ?? "full";

  insertSyncJob({
    id: jobId,
    username: input.username,
    lane: input.lane,
    trigger: input.trigger,
    mode,
    status: "queued",
    savePassword: input.savePassword ? 1 : 0,
    idempotencyKey,
    passwordEnc: sealQueuePassword(input.password),
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    resultJson: null,
    errorCode: null,
    errorMessage: null,
  });

  const created = findSyncJobById(jobId);
  if (!created) {
    throw new Error("Falha ao persistir job na fila.");
  }

  return {
    job: toSyncQueueJobView(created),
    reused: false,
  };
}
