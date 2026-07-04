import { resolveSyncQueuePassword } from "@/lib/sync-queue/resolve-sync-queue-credentials";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import {
  kickSyncQueueDispatcher,
} from "@/lib/sync-queue/sync-queue-dispatcher";
import type {
  SyncQueueJobView,
  SyncQueueLane,
  SyncJobTrigger,
} from "@/lib/sync-queue/types";
import { waitForSyncJob } from "@/lib/sync-queue/wait-for-sync-job";
import type { SyncMode } from "@/lib/types/sync-pipeline";

export interface RunQueuedSyncInput {
  username: string;
  password?: string;
  mode?: SyncMode;
  lane?: SyncQueueLane;
  trigger: SyncJobTrigger;
  savePassword?: boolean;
  skipCooldown?: boolean;
  idempotencyKey?: string;
  waitTimeoutMs?: number;
}

export interface RunQueuedSyncResult {
  job: SyncQueueJobView;
  reused: boolean;
}

export function resolveSyncQueueLane(
  trigger: SyncJobTrigger,
  explicitLane?: SyncQueueLane
): SyncQueueLane {
  if (explicitLane) return explicitLane;
  return trigger === "first_login" ? "priority" : "normal";
}

export async function runQueuedSync(
  input: RunQueuedSyncInput
): Promise<RunQueuedSyncResult> {
  const password = resolveSyncQueuePassword({
    username: input.username,
    password: input.password,
  });

  const enqueueResult = enqueueSyncJob({
    username: input.username.trim(),
    password,
    mode: input.mode ?? "full",
    lane: resolveSyncQueueLane(input.trigger, input.lane),
    trigger: input.trigger,
    savePassword: input.savePassword,
    skipCooldown: input.skipCooldown,
    idempotencyKey: input.idempotencyKey,
  });

  if (!enqueueResult.reused) {
    kickSyncQueueDispatcher();
  }

  const job = await waitForSyncJob(
    enqueueResult.job.jobId,
    input.waitTimeoutMs ?? 360_000
  );

  return {
    job,
    reused: enqueueResult.reused,
  };
}
