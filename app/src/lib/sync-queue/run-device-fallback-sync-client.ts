import {
  ApiClientError,
  getNotifications,
  notifySyncComplete,
} from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import { createWebSigaaRelayFetch } from "@/lib/device-sync/web-sigaa-relay-fetch";
import { runDeviceR1Sync } from "@/lib/device-sync/run-device-r1-sync";
import { capturePreSyncNotificationBaseline } from "@/lib/notifications/notification-pre-sync-baseline";
import type { SyncMode, SyncRequest, SyncStep } from "@/lib/types/sync";
import type { SyncJobTrigger } from "@/lib/types/sync-queue-api";

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

export interface RunDeviceFallbackSyncOptions {
  creds: SyncRequest;
  mode: SyncMode;
  trigger: SyncJobTrigger;
  onUiStep: (step: SyncStep) => void;
  signal?: AbortSignal;
}

/**
 * Fallback §6.1.1 no web: raspa no browser via relay TLS + ingest.
 */
export async function runDeviceFallbackSyncClient(
  options: RunDeviceFallbackSyncOptions
): Promise<void> {
  const password = options.creds.password?.trim();
  if (!password) {
    throw new ApiClientError(
      "Faça login novamente para sincronizar.",
      "INVALID_CREDENTIALS",
      401
    );
  }

  const session = getSession();
  if (!session?.accessToken) {
    throw new ApiClientError(
      "Faça login no app para sincronizar pelo aparelho.",
      "UNAUTHORIZED",
      401
    );
  }

  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  await captureNotificationBaselineBeforeSync();

  const { snapshot, steps } = await runDeviceR1Sync({
    username: options.creds.username,
    password,
    fetchImpl: createWebSigaaRelayFetch(),
    onStep: options.onUiStep,
  });

  for (const step of steps) {
    options.onUiStep(step);
  }

  options.onUiStep({ label: "Enviando dados à nuvem…", progress: 92 });

  const response = await fetch("/api/sync/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ source: "device", snapshot }),
    signal: options.signal,
  });

  if (!response.ok) {
    let message = "Falha ao enviar sync do aparelho.";
    let code: "SIGAA_SCRAPE_FAILED" | "RATE_LIMITED" | "UNAUTHORIZED" =
      "SIGAA_SCRAPE_FAILED";
    try {
      const payload = (await response.json()) as {
        code?: string;
        message?: string;
      };
      if (payload.message) message = payload.message;
      if (
        payload.code === "RATE_LIMITED" ||
        payload.code === "UNAUTHORIZED" ||
        payload.code === "SIGAA_SCRAPE_FAILED"
      ) {
        code = payload.code;
      }
    } catch {
      // ignore
    }
    throw new ApiClientError(message, code, response.status);
  }

  options.onUiStep({ label: "Sincronização concluída.", progress: 100 });
  notifySyncComplete();
}
