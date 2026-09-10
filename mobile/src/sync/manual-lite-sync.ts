import { DeviceEventEmitter } from "react-native";
import type {
  SyncQueueEnqueueResponse,
  SyncQueueJobResponse,
  SyncQueueJobView,
  SyncStep,
} from "@acme/api-contracts";
import { ApiClientError, requestJson } from "../auth/api";
import { getSession } from "../auth/session";
import {
  DeviceSyncError,
  runOnDeviceFallbackSync,
} from "../device-sync/run-on-device-fallback";
import { queueJobToUiStep } from "./queue-job-ui";

export const SYNC_COMPLETE_EVENT = "planner:sync-complete";

const POLL_MS = 800;
const TIMEOUT_MS = 360_000;

export type MobileSyncState = {
  syncing: boolean;
  progress: number;
  stepLabel: string;
  error: string | null;
  job: SyncQueueJobView | null;
};

type Listener = (state: MobileSyncState) => void;

let syncingLock = false;
let state: MobileSyncState = {
  syncing: false,
  progress: 0,
  stepLabel: "",
  error: null,
  job: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(state);
}

function setState(patch: Partial<MobileSyncState>) {
  state = { ...state, ...patch };
  emit();
}

export function getSyncState(): MobileSyncState {
  return state;
}

export function subscribeSyncState(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function resetSyncError(): void {
  setState({ error: null });
}

async function pollJobUntilDone(
  jobId: string
): Promise<SyncQueueJobView> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await requestJson<SyncQueueJobResponse>(
      `/api/sync/queue/${encodeURIComponent(jobId)}`
    );
    const job = response.job;
    const step = queueJobToUiStep(job);
    setState({
      job,
      progress: step.progress,
      stepLabel: step.label,
    });

    if (job.status === "completed") return job;
    if (job.status === "failed") {
      throw new ApiClientError(
        job.error?.message ?? "Falha no sync enfileirado.",
        500,
        job.error?.code ?? "INTERNAL_ERROR"
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  throw new ApiClientError(
    "Sync excedeu o tempo limite aguardando a fila.",
    504,
    "SIGAA_TIMEOUT"
  );
}

async function isWorkerOnline(): Promise<boolean> {
  try {
    const health = await requestJson<{
      ok: true;
      online: boolean;
    }>("/api/sync/worker-health");
    return Boolean(health.online);
  } catch {
    return false;
  }
}

/** Fallback §6.1.1 — raspa no aparelho + ingest (sem Cloudflare→SIGAA). */
async function runDeviceFallback(): Promise<void> {
  await runOnDeviceFallbackSync((label, progress) => {
    setState({ progress, stepLabel: label });
  });
  setState({
    syncing: false,
    progress: 100,
    stepLabel: "Sincronização concluída.",
    error: null,
    job: null,
  });
  DeviceEventEmitter.emit(SYNC_COMPLETE_EVENT);
}

function mapFallbackError(error: unknown): string {
  if (error instanceof DeviceSyncError) return error.message;
  if (error instanceof ApiClientError) {
    if (/526|relay|device-run/i.test(error.message)) {
      return "Não foi possível sincronizar agora. Tente novamente em alguns minutos.";
    }
    return error.message;
  }
  return "Falha na sincronização. Tente novamente.";
}

/**
 * Sync manual lite:
 * - PC worker online → fila cloud
 * - offline → HTTP no aparelho + ingest-html
 */
export async function startManualLiteSync(): Promise<boolean> {
  if (syncingLock || state.syncing) return false;

  const session = getSession();
  if (!session?.cpf) {
    setState({ error: "Sessão inválida. Faça login novamente." });
    return false;
  }

  syncingLock = true;
  setState({
    syncing: true,
    progress: 5,
    stepLabel: "Iniciando sincronização…",
    error: null,
    job: null,
  });

  try {
    if (!(await isWorkerOnline())) {
      await runDeviceFallback();
      return true;
    }

    const enqueue = await requestJson<SyncQueueEnqueueResponse>(
      "/api/sync/queue",
      {
        method: "POST",
        body: JSON.stringify({
          username: session.cpf,
          mode: "lite",
          trigger: "manual",
          lane: "normal",
        }),
      }
    );

    const step = queueJobToUiStep(enqueue.job);
    setState({
      job: enqueue.job,
      progress: step.progress,
      stepLabel: step.label,
    });

    const finished = await pollJobUntilDone(enqueue.job.jobId);
    const doneStep: SyncStep =
      finished.result?.steps?.[finished.result.steps.length - 1] ?? {
        label: "Sincronização concluída.",
        progress: 100,
      };

    setState({
      syncing: false,
      job: finished,
      progress: 100,
      stepLabel: doneStep.label,
      error: null,
    });

    DeviceEventEmitter.emit(SYNC_COMPLETE_EVENT);
    return true;
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 503 || error.code === "SIGAA_OFFLINE")
    ) {
      try {
        await runDeviceFallback();
        return true;
      } catch (fallbackError) {
        setState({
          syncing: false,
          error: mapFallbackError(fallbackError),
          stepLabel: "",
          progress: 0,
        });
        return false;
      }
    }

    setState({
      syncing: false,
      error: mapFallbackError(error),
      stepLabel: "",
      progress: 0,
    });
    return false;
  } finally {
    syncingLock = false;
  }
}
