import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api/errors";
import { sealQueuePassword } from "@/lib/sync-queue/queue-credential-seal";
import { resolveSyncQueuePassword } from "@/lib/sync-queue/resolve-sync-queue-credentials";
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
  SyncQueueLane,
} from "@/lib/sync-queue/types";
import { readEffectiveSyncPolicySync } from "@/lib/sync-policy/app-config-store";
import { resolveSyncModeForTrigger } from "@/lib/sync-policy/resolve-sync-mode";
import { getSyncLastAt } from "@/lib/sync/sync-preferences";
import {
  isAutoSyncEligible,
  isManualSyncEligible,
  msUntilAutoSyncEligible,
  msUntilManualSyncEligible,
} from "@/lib/sync/sync-cooldown-policy";

function resolveLane(input: EnqueueSyncJobInput): SyncQueueLane {
  if (input.lane) return input.lane;
  return input.trigger === "first_login" ? "priority" : "normal";
}

function assertManualCooldown(username: string, skipCooldown?: boolean): void {
  if (skipCooldown) return;

  const lastAt = getLatestManualEnqueueAt(username);
  const waitMs = msUntilManualSyncEligible(lastAt);
  if (waitMs <= 0) return;

  throw new ApiError(
    "RATE_LIMITED",
    `Aguarde ${Math.ceil(waitMs / 1000)}s antes de enfileirar outro sync manual.`,
    429
  );
}

function assertAutoCooldown(skipCooldown?: boolean): void {
  if (skipCooldown) return;

  const lastAt = getSyncLastAt();
  if (isAutoSyncEligible(lastAt)) return;

  const waitMs = msUntilAutoSyncEligible(lastAt);
  throw new ApiError(
    "RATE_LIMITED",
    `Auto-sync disponível em ${Math.ceil(waitMs / 1000)}s.`,
    429
  );
}

function assertTriggerCooldown(input: EnqueueSyncJobInput): void {
  if (input.skipCooldown || input.trigger === "dev") return;

  if (input.trigger === "manual") {
    assertManualCooldown(input.username, input.skipCooldown);
    return;
  }

  if (input.trigger === "auto") {
    assertAutoCooldown(input.skipCooldown);
  }
}

export async function enqueueSyncJob(
  input: EnqueueSyncJobInput
): Promise<EnqueueSyncJobResult> {
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

  assertTriggerCooldown(input);

  const password = await resolveSyncQueuePassword({
    username: input.username,
    password: input.password,
  });

  const now = new Date().toISOString();
  const jobId = randomUUID();
  const policy = readEffectiveSyncPolicySync();
  const mode =
    input.mode ??
    resolveSyncModeForTrigger({
      trigger: input.trigger,
      buttonScope: policy.buttonScope,
    });
  const lane = resolveLane(input);

  insertSyncJob({
    id: jobId,
    username: input.username.trim(),
    lane,
    trigger: input.trigger === "dev" ? "manual" : input.trigger,
    mode,
    status: "queued",
    savePassword: input.savePassword ? 1 : 0,
    idempotencyKey,
    passwordEnc: sealQueuePassword(password),
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
