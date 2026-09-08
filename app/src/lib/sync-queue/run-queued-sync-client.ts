import {
  ApiClientError,
  getNotifications,
  notifySyncComplete,
  postSyncQueue,
} from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import { capturePreSyncNotificationBaseline } from "@/lib/notifications/notification-pre-sync-baseline";
import { resolveQueueLane } from "@/lib/sync-queue/format-sync-queue-ui";
import { pollSyncJobUntilDone } from "@/lib/sync-queue/poll-sync-job-client";
import { runServerDeviceRunClient } from "@/lib/sync-queue/run-server-device-run-client";
import { queueJobToUiStep } from "@/lib/sync-queue/sync-queue-ui-progress";
import type { SyncMode, SyncRequest, SyncStep } from "@/lib/types/sync";
import type {
  SyncJobTrigger,
  SyncQueueJobView,
} from "@/lib/types/sync-queue-api";

interface WorkerHealthClientResponse {
  ok: true;
  online: boolean;
  configured: boolean;
}

async function isSigaaWorkerOnlineClient(): Promise<boolean> {
  try {
    const session = getSession();
    const headers: HeadersInit = {};
    if (session?.mode === "cloud" && session.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    const response = await fetch("/api/sync/worker-health", { headers });
    if (!response.ok) return false;
    const payload = (await response.json()) as WorkerHealthClientResponse;
    return Boolean(payload.online);
  } catch {
    return false;
  }
}

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
  const { creds, mode, trigger, onJobUpdate, onUiStep, signal } = options;

  const session = getSession();
  const cloudSession = session?.mode === "cloud" && Boolean(session.accessToken);

  // Sync híbrido §6.1.1: se o worker do PC estiver offline, fallback aparelho/edge.
  if (cloudSession && !(await isSigaaWorkerOnlineClient())) {
    onJobUpdate(null);
    await runHybridOfflineFallback({
      creds,
      mode,
      trigger,
      onUiStep,
      signal,
    });
    return;
  }

  await captureNotificationBaselineBeforeSync();

  try {
    const enqueue = await postSyncQueue({
      username: creds.username,
      password: creds.password || undefined,
      mode,
      lane: resolveQueueLane(trigger),
      trigger,
      savePassword: creds.savePassword,
    });

    onJobUpdate(enqueue.job);
    // O progresso é sempre exibido (inclusive em background); `background` só
    // silencia erros — nunca esconde o indicador de sincronização.
    onUiStep(queueJobToUiStep(enqueue.job));

    const finished = await pollSyncJobUntilDone(enqueue.job.jobId, {
      onUpdate: (job) => {
        onJobUpdate(job);
        onUiStep(queueJobToUiStep(job));
      },
      signal,
      sigaaUsername: creds.username,
    });

    onJobUpdate(finished);

    if (finished.result?.steps?.length) {
      await playSyncSteps(finished.result.steps, onUiStep);
    }

    notifySyncComplete();
  } catch (error) {
    // Race: health OK mas enqueue caiu (túnel caiu no meio) → tenta aparelho.
    if (
      cloudSession &&
      error instanceof ApiClientError &&
      (error.code === "SIGAA_OFFLINE" || error.status === 503)
    ) {
      onJobUpdate(null);
      await runHybridOfflineFallback({
        creds,
        mode,
        trigger,
        onUiStep,
        signal,
      });
      return;
    }
    throw error;
  }
}

async function runHybridOfflineFallback(options: {
  creds: SyncRequest;
  mode: SyncMode;
  trigger: SyncJobTrigger;
  onUiStep: (step: SyncStep) => void;
  signal?: AbortSignal;
}): Promise<void> {
  // No browser usamos só o edge (`device-run`) — evita puxar parsers/Node no bundle client.
  void options.mode;
  void options.trigger;
  await runServerDeviceRunClient({
    password: options.creds.password || undefined,
    onUiStep: options.onUiStep,
    signal: options.signal,
  });
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
