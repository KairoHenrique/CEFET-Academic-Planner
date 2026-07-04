import {
  ApiClientError,
  getNotifications,
  notifySyncComplete,
  postSyncQueue,
} from "@/lib/api/client";
import { capturePreSyncNotificationBaseline } from "@/lib/notifications/notification-pre-sync-baseline";
import { resolveQueueLane } from "@/lib/sync-queue/format-sync-queue-ui";
import { pollSyncJobUntilDone } from "@/lib/sync-queue/poll-sync-job-client";
import { queueJobToUiStep } from "@/lib/sync-queue/sync-queue-ui-progress";
import type { SyncMode, SyncRequest, SyncStep } from "@/lib/types/sync";
import type {
  SyncJobTrigger,
  SyncQueueJobView,
} from "@/lib/types/sync-queue-api";

const STEP_DELAY_MS = 280;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function playSyncSteps(
  steps: SyncStep[],
  onStep: (step: SyncStep) => void
): Promise<void> {
  for (const step of steps) {
    onStep(step);
    if (step.progress < 100) {
      await delay(STEP_DELAY_MS);
    }
  }
}

async function captureNotificationBaselineBeforeSync(): Promise<void> {
  try {
    const snapshot = await getNotifications();
    capturePreSyncNotificationBaseline(
      snapshot.items.map((item) => item.fingerprint)
    );
  } catch {
    capturePreSyncNotificationBaseline([]);
  }
}

export interface RunQueuedSyncClientOptions {
  creds: SyncRequest;
  mode: SyncMode;
  trigger: SyncJobTrigger;
  background: boolean;
  onJobUpdate: (job: SyncQueueJobView | null) => void;
  onUiStep: (step: SyncStep) => void;
  signal?: AbortSignal;
}

export async function runQueuedSyncClient(
  options: RunQueuedSyncClientOptions
): Promise<void> {
  const { creds, mode, trigger, background, onJobUpdate, onUiStep, signal } =
    options;

  await captureNotificationBaselineBeforeSync();

  const enqueue = await postSyncQueue({
    username: creds.username,
    password: creds.password || undefined,
    mode,
    lane: resolveQueueLane(trigger),
    trigger,
    savePassword: creds.savePassword,
  });

  onJobUpdate(enqueue.job);

  if (!background) {
    onUiStep(queueJobToUiStep(enqueue.job));
  }

  const finished = await pollSyncJobUntilDone(enqueue.job.jobId, {
    onUpdate: (job) => {
      onJobUpdate(job);
      if (!background) {
        onUiStep(queueJobToUiStep(job));
      }
    },
    signal,
    sigaaUsername: creds.username,
  });

  onJobUpdate(finished);

  if (!background && finished.result?.steps?.length) {
    await playSyncSteps(finished.result.steps, onUiStep);
  }

  notifySyncComplete();
}

export function mapQueuedSyncError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Falha na sincronização. Tente novamente.";
}

export function isSilentBackgroundSyncError(
  error: unknown,
  background: boolean
): boolean {
  if (!background || !(error instanceof ApiClientError)) {
    return false;
  }

  return error.code === "RATE_LIMITED";
}

export function shouldLogoutOnBackgroundSyncError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;

  return (
    error.code === "INVALID_CREDENTIALS" || error.code === "SIGAA_AUTH_FAILED"
  );
}
