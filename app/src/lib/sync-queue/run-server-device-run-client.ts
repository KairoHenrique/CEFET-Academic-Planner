import {
  ApiClientError,
  notifySyncComplete,
} from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { SyncStep } from "@/lib/types/sync";

/**
 * Quando o PC está offline e o client não tem senha em memória,
 * o edge roda scrape HTTP (vault) + ingest — `POST /api/sync/device-run`.
 */
export async function runServerDeviceRunClient(options: {
  password?: string;
  onUiStep: (step: SyncStep) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const session = getSession();
  if (!session?.accessToken) {
    throw new ApiClientError(
      "Faça login no app para sincronizar.",
      "UNAUTHORIZED",
      401
    );
  }

  options.onUiStep({
    label: "Servidor offline — sync pelo aparelho/edge…",
    progress: 15,
  });

  const response = await fetch("/api/sync/device-run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(
      options.password?.trim()
        ? { password: options.password.trim() }
        : {}
    ),
    signal: options.signal,
  });

  if (!response.ok) {
    let message = "Falha no sync pelo aparelho.";
    let code: "SIGAA_SCRAPE_FAILED" | "INVALID_CREDENTIALS" | "SIGAA_OFFLINE" =
      "SIGAA_SCRAPE_FAILED";
    try {
      const payload = (await response.json()) as {
        code?: string;
        message?: string;
      };
      if (payload.message) message = payload.message;
      if (
        payload.code === "INVALID_CREDENTIALS" ||
        payload.code === "SIGAA_OFFLINE" ||
        payload.code === "SIGAA_SCRAPE_FAILED"
      ) {
        code = payload.code;
      }
    } catch {
      // ignore
    }
    throw new ApiClientError(message, code, response.status);
  }

  const payload = (await response.json()) as { steps?: SyncStep[] };
  if (payload.steps?.length) {
    for (const step of payload.steps) {
      options.onUiStep(step);
    }
  }

  options.onUiStep({
    label: "Sincronização concluída (aparelho/edge)",
    progress: 100,
  });
  notifySyncComplete();
}
