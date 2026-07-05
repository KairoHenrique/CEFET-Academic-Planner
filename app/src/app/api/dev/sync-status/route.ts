export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { getDevSyncStatus } from "@/lib/dev-panel/get-dev-sync-status";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireDevOperator(request);
    const status = await getDevSyncStatus();
    return apiSuccess({ ok: true as const, ...status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
