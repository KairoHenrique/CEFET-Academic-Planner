export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError, unauthorizedError, validationError } from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { updateTarefaConcluida } from "@/lib/db/queries";
import { pgGetTarefaById } from "@/lib/db/postgres/queries-write";
import {
  pgGetTaskSubmission,
  pgMarkTaskSubmissionCompleted,
  pgMarkTaskSubmissionFailed,
} from "@/lib/task-submissions/task-submissions-store";

export const runtime = "nodejs";

/**
 * Confirma envio feito no aparelho (PC worker offline).
 * Body: { submissionId, ok, errorMessage? }
 */
export const POST = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError("Disponível apenas no cloud.");
    }
    await ensurePostgresReady();
    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) throw unauthorizedError("Faça login.");
    await enforceSubscriptionAccessGate(profile);

    const { id } = await context.params;
    const tarefaId = Number(id);
    if (!Number.isFinite(tarefaId)) {
      throw validationError("Tarefa inválida.");
    }

    const body = (await request.json()) as {
      submissionId?: string;
      ok?: boolean;
      errorMessage?: string;
    };
    const submissionId = body.submissionId?.trim();
    if (!submissionId) throw validationError("submissionId obrigatório.");

    const row = await pgGetTaskSubmission(submissionId);
    if (!row || row.userId !== profile.userId || row.tarefaId !== tarefaId) {
      throw new ApiError("NOT_FOUND", "Envio não encontrado.", 404);
    }

    if (body.ok === true) {
      await pgMarkTaskSubmissionCompleted(submissionId);
      try {
        const tarefa = await pgGetTarefaById(tarefaId);
        if (tarefa) {
          // Marca concluída no Postgres via queries-write se disponível
          const { getPostgresPool } = await import("@/lib/db/postgres/pool");
          await getPostgresPool().query(
            `UPDATE tarefas SET concluida = 1
             WHERE user_id = $1 AND id = $2`,
            [profile.userId, tarefaId]
          );
        }
      } catch {
        try {
          updateTarefaConcluida(tarefaId, true);
        } catch {
          /* ignore */
        }
      }
      return apiSuccess({
        submissionId,
        status: "completed" as const,
      });
    }

    await pgMarkTaskSubmissionFailed(
      submissionId,
      body.errorMessage?.trim() || "Falha no envio pelo aparelho."
    );
    return apiSuccess({
      submissionId,
      status: "failed" as const,
    });
  } catch (error) {
    if (error instanceof ApiError) return apiErrorResponse(error);
    return apiErrorResponse(error);
  }
};
