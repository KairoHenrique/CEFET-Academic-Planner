export const dynamic = "force-dynamic";

import { unauthorizedError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/health/check-health";
import { runSyncOrchestratorTick } from "@/lib/sync-orchestrator/run-orchestrator-tick";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiErrorResponse(unauthorizedError("Cron não autorizado."));
  }

  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "1";
    const result = await runSyncOrchestratorTick({ force });
    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
