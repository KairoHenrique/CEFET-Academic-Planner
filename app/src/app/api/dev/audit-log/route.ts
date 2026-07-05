export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { listDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireDevOperator(request);
    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const entries = await listDevAuditLog(
      Number.isFinite(limit) ? limit : 50
    );

    return apiSuccess({ ok: true as const, entries });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
