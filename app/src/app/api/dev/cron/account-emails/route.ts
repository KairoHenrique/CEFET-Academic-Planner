export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { runAccountEmailCron } from "@/lib/email/run-account-email-cron";

export const runtime = "nodejs";

/** Dispara manualmente o cron de e-mails de conta (B62) pelo painel dev. */
export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);

    if (!isPostgresBackend()) {
      return apiSuccess({
        ok: true as const,
        message: "Cron de e-mails indisponível: Postgres não ativo.",
      });
    }

    const result = await runAccountEmailCron();

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.cron.account_emails",
      detail: { ...result },
    });

    return apiSuccess({
      ok: true as const,
      message: `E-mails: ${result.sent} enviado(s), ${result.scheduled} agendado(s), ${result.failed} falha(s).`,
      detail: { ...result },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
