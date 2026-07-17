export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { runSyncOrchestratorTick } from "@/lib/sync-orchestrator/run-orchestrator-tick";

export const runtime = "nodejs";

/** Dispara manualmente um tick do orquestrador (force) pelo painel dev. */
export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    const result = await runSyncOrchestratorTick({ force: true });

    const executedCount = result.executed.filter(
      (item) => item.status === "done" || item.status === "queued"
    ).length;

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.orchestrator.tick",
      detail: { executed: executedCount, actions: result.executed.length },
    });

    return apiSuccess({
      ok: true as const,
      message:
        executedCount > 0
          ? `Tick executado — ${executedCount} ação(ões) disparada(s).`
          : "Tick executado — nada elegível no momento.",
      detail: {
        executed: result.executed,
        actions: result.plan.actions.length,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
