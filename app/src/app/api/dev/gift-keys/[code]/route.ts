export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { notFoundError } from "@/lib/api/errors";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { revokeGiftKey } from "@/lib/billing/gift-keys/gift-key-repository";
import { normalizeGiftKeyCode } from "@/lib/billing/gift-keys/gift-key-schema";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = requireDevOperator(request);
    await ensurePostgresReady();

    const { code: rawCode } = await context.params;
    const code = normalizeGiftKeyCode(rawCode);
    const revoked = await revokeGiftKey(code);

    if (!revoked) {
      throw notFoundError("Chave não encontrada ou não revogável.");
    }

    appendDevAuditLog({
      action: "gift_keys.revoke",
      operatorEmail: session.email,
      details: { code },
    });

    return apiSuccess({ ok: true as const, key: revoked });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
