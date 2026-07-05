export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { resetDevSyncPolicy } from "@/lib/dev-panel/sync-policy-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    const policy = await resetDevSyncPolicy();

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.sync_policy.reset",
    });

    return apiSuccess({ ok: true as const, ...policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
