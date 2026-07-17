export const dynamic = "force-dynamic";

import { validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { listDevSubscriptions } from "@/lib/dev-panel/list-dev-subscriptions";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

/** Histórico de assinaturas de uma conta (painel dev). */
export async function GET(request: Request) {
  try {
    requireDevOperator(request);

    const url = new URL(request.url);
    const accountRef = url.searchParams.get("accountRef")?.trim() ?? "";
    if (!accountRef) {
      throw validationError("Informe a conta (accountRef).");
    }

    const result = await listDevSubscriptions(accountRef);
    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
