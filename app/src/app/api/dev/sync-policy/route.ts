export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { parseSyncPolicyPatchBody } from "@/lib/dev-panel/parse-dev-requests";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import {
  getDevSyncPolicy,
  patchDevSyncPolicy,
} from "@/lib/dev-panel/sync-policy-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireDevOperator(request);
    const policy = await getDevSyncPolicy();
    return apiSuccess({ ok: true as const, ...policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireDevOperator(request);
    const body = await request.json();
    const patch = parseSyncPolicyPatchBody(body);
    const policy = await patchDevSyncPolicy(patch);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.sync_policy.patch",
      detail: { keys: Object.keys(patch) },
    });

    return apiSuccess({ ok: true as const, ...policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
