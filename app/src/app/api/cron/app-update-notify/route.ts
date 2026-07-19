export const dynamic = "force-dynamic";

import { unauthorizedError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { verifyCronSecret } from "@/lib/health/check-health";
import { runAppUpdateNotifyCheck } from "@/lib/push/run-app-update-notify";

export const runtime = "nodejs";

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

  try {
    const result = await runAppUpdateNotifyCheck();
    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
