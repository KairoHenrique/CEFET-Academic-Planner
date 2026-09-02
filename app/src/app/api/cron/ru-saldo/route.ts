export const dynamic = "force-dynamic";

import { unauthorizedError, validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { verifyCronSecret } from "@/lib/health/check-health";
import type { RuCronSlot } from "@/lib/sync/run-ru-saldo-cron";

export const runtime = "nodejs";

function parseSlot(raw: string | null): RuCronSlot | null {
  if (raw === "almoco" || raw === "jantar") return raw;
  return null;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiErrorResponse(unauthorizedError("Cron não autorizado."));
  }

  if (!isPostgresBackend()) {
    return apiSuccess({
      ok: true as const,
      skipped: true as const,
      reason: "Postgres backend não ativo.",
    });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const slot = parseSlot(url.searchParams.get("slot"));
  if (url.searchParams.get("slot") && !slot) {
    return apiErrorResponse(
      validationError('Query slot deve ser "almoco" ou "jantar".')
    );
  }

  try {
    const { runRuSaldoCron } = await import("@/lib/sync/run-ru-saldo-cron");
    const result = await withCloudPostgresClient(() =>
      runRuSaldoCron({ force, slot })
    );
    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
