export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { parsePositiveIntParam } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { ApiError } from "@/lib/api/errors";
import {
  getTaskSubmissionStatus,
  submitTarefaToSigaa,
  TASK_SUBMISSION_MAX_BYTES,
} from "@/lib/task-submissions/submit-tarefa-service";

type RouteContext = { params: Promise<{ id: string }> };

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "arquivo";
  return base.replace(/[^\w.\-() áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ-]/g, "_").slice(0, 180);
}

export const POST = withDb(async (request, context: RouteContext) => {
  const profile = await resolveProfileFromAuthorization(
    request.headers.get("Authorization")
  );
  if (!profile?.userId || !profile.cpf) {
    throw new ApiError("UNAUTHORIZED", "Sessão inválida.", 401);
  }

  const { id } = await context.params;
  const tarefaId = parsePositiveIntParam(id, "ID da tarefa");

  const form = await request.formData();
  const file = form.get("file");
  const commentRaw = form.get("comment");
  const comment =
    typeof commentRaw === "string" ? commentRaw.slice(0, 8000) : null;

  if (!(file instanceof File)) {
    throw new ApiError("VALIDATION_ERROR", "Arquivo é obrigatório.", 400);
  }
  if (file.size <= 0) {
    throw new ApiError("VALIDATION_ERROR", "Arquivo vazio.", 400);
  }
  if (file.size > TASK_SUBMISSION_MAX_BYTES) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Arquivo excede 10 MB (limite do SIGAA).",
      400
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await submitTarefaToSigaa({
    userId: profile.userId,
    cursoId: profile.cursoId ?? "eng-computacao",
    username: profile.cpf,
    tarefaId,
    fileName: sanitizeFileName(file.name || "arquivo"),
    fileMime: file.type || null,
    fileBytes: bytes,
    comment,
  });

  return apiSuccess(result, 202);
});

export const GET = withDb(async (request, context: RouteContext) => {
  const profile = await resolveProfileFromAuthorization(
    request.headers.get("Authorization")
  );
  if (!profile?.userId) {
    throw new ApiError("UNAUTHORIZED", "Sessão inválida.", 401);
  }

  const { id } = await context.params;
  const tarefaId = parsePositiveIntParam(id, "ID da tarefa");
  const url = new URL(request.url);
  const submissionId = url.searchParams.get("submissionId")?.trim();
  if (!submissionId) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Informe submissionId na query string.",
      400
    );
  }

  const status = await getTaskSubmissionStatus(submissionId);
  if (status.tarefaId !== tarefaId) {
    throw new ApiError("NOT_FOUND", "Envio não encontrado para esta tarefa.", 404);
  }

  return apiSuccess(status);
});
