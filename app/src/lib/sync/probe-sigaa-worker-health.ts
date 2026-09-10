import { resolveWorkerDispatchConfig } from "@/lib/sync-queue/worker-dispatch";

export interface SigaaWorkerHealthResult {
  online: boolean;
  configured: boolean;
  latencyMs: number | null;
  reason?: string;
}

const DEFAULT_TIMEOUT_MS = 4_000;

/**
 * Sonda o worker Playwright do Servidor ACME (`GET {SIGAA_WORKER_URL}/health`).
 *
 * Usado pelo sync híbrido: online → cloud despacha job Playwright;
 * offline → client tenta sync no aparelho (Android) em vez de falhar cedo.
 * Timeout curto de propósito — não pode travar a UI de sync.
 */
export async function probeSigaaWorkerHealth(
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<SigaaWorkerHealthResult> {
  const config = resolveWorkerDispatchConfig();
  if (!config) {
    return {
      online: false,
      configured: false,
      latencyMs: null,
      reason: "SIGAA_WORKER_URL ou WORKER_SHARED_SECRET ausente.",
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.workerUrl}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.workerSecret}`,
      },
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        online: false,
        configured: true,
        latencyMs,
        reason: `Worker respondeu ${response.status}.`,
      };
    }

    return { online: true, configured: true, latencyMs };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "Timeout ao contactar o worker."
        : "Worker inacessível.";
    return {
      online: false,
      configured: true,
      latencyMs: Date.now() - startedAt,
      reason,
    };
  } finally {
    clearTimeout(timer);
  }
}
