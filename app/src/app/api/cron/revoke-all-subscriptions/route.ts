export const dynamic = "force-dynamic";

import { unauthorizedError, validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { revokeAllActiveSubscriptions } from "@/lib/billing/checkout/revoke-all-active-subscriptions";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { verifyCronSecret } from "@/lib/health/check-health";

export const runtime = "nodejs";

const CONFIRM = "REVOKE_ALL_PLANS";

/** One-shot ops: zera assinaturas ativas de todos os usuarios. */
export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiErrorResponse(unauthorizedError("Cron nao autorizado."));
  }

  const url = new URL(request.url);
  if (url.searchParams.get("confirm") !== CONFIRM) {
    return apiErrorResponse(
      validationError(`Informe confirm=${CONFIRM} para executar.`)
    );
  }

  if (!isPostgresBackend()) {
    return apiSuccess({
      ok: true as const,
      skipped: true as const,
      reason: "Postgres backend nao ativo.",
    });
  }

  try {
    const result = await withCloudPostgresClient(() =>
      revokeAllActiveSubscriptions()
    );
    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
