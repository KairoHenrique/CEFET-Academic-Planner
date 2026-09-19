export const dynamic = "force-dynamic";

import { unauthorizedError, validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { verifyCronSecret } from "@/lib/health/check-health";

export const runtime = "nodejs";

/**
 * Dispara push de um aluno (pós-sync no worker do PC → cloud).
 * Body: `{ "cpf": "###########" }`
 */
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
    const body = (await request.json().catch(() => null)) as {
      cpf?: string;
      fallbackSyncToast?: boolean;
      source?: "sync" | "cron";
    } | null;
    const cpf = normalizeCpf(body?.cpf ?? "");
    if (cpf.length !== 11) {
      return apiErrorResponse(validationError("CPF inválido."));
    }

    const { dispatchNotificationPushesForCpf } = await import(
      "@/lib/push/dispatch-notification-pushes"
    );

    const source: "sync" | "cron" =
      body?.source === "cron"
        ? "cron"
        : body?.source === "sync" || body?.fallbackSyncToast !== false
          ? "sync"
          : "cron";

    await withCloudPostgresClient(() =>
      dispatchNotificationPushesForCpf(cpf, {
        fallbackSyncToast: body?.fallbackSyncToast !== false,
        source,
      })
    );

    return apiSuccess({ ok: true as const, cpfLast4: cpf.slice(-4) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
