export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { probeSigaaWorkerHealth } from "@/lib/sync/probe-sigaa-worker-health";

export const runtime = "nodejs";

/**
 * Health do worker PC para o flip híbrido (client web/mobile).
 * Não expõe URL/secret do worker — só online/configured/latency.
 */
export const GET = async () => {
  try {
    const health = await probeSigaaWorkerHealth();
    return apiSuccess({
      ok: true as const,
      online: health.online,
      configured: health.configured,
      latencyMs: health.latencyMs,
      // reason só quando offline (ops); sem PII
      reason: health.online ? undefined : health.reason,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
};
