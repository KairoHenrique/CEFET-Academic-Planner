export const dynamic = "force-dynamic";

import { validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { revokeDevSubscription } from "@/lib/dev-panel/revoke-dev-subscription";

export const runtime = "nodejs";

/** Revoga (cancela) as assinaturas ativas de uma conta (painel dev). */
export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);

    const body = (await request.json().catch(() => null)) as {
      accountRef?: unknown;
    } | null;
    const accountRef =
      body && typeof body.accountRef === "string" ? body.accountRef.trim() : "";
    if (!accountRef) {
      throw validationError("Informe a conta (accountRef).");
    }

    const result = await revokeDevSubscription(accountRef);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.subscription.revoke",
      detail: { cpfLast4: result.cpfLast4, cancelled: result.cancelled },
    });

    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
