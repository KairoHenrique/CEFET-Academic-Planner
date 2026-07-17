export const dynamic = "force-dynamic";

import { validationError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { retryDevSyncJob } from "@/lib/dev-panel/retry-dev-sync-job";

export const runtime = "nodejs";

/** Reprocessa um job de sync que falhou, re-enfileirando ao worker do PC. */
export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);

    const body = (await request.json().catch(() => null)) as {
      jobId?: unknown;
    } | null;
    const jobId =
      body && typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      throw validationError("Informe o ID do job a reprocessar.");
    }

    const result = await retryDevSyncJob(jobId);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.sync_job.retry",
      detail: { sourceJobId: jobId, newJobId: result.jobId, reused: result.reused },
    });

    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
