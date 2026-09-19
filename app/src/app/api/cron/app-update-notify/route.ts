export const dynamic = "force-dynamic";

import { unauthorizedError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { verifyCronSecret } from "@/lib/health/check-health";

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
    const { runAppUpdateNotifyCheck } = await import(
      "@/lib/push/run-app-update-notify"
    );
    const result = await withCloudPostgresClient(() =>
      runAppUpdateNotifyCheck()
    );
    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
