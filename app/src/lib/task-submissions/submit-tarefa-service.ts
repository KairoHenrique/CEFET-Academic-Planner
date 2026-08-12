import { ApiError } from "@/lib/api/errors";
import { openServerSigaaCredentialsForWorker, sealServerSigaaPassword } from "@/lib/crypto/server-sigaa-credential-store";
import { pgGetTarefaById } from "@/lib/db/postgres/queries-write";
import { resolveWorkerDispatchConfig } from "@/lib/sync-queue/worker-dispatch";
import {
  pgCreateTaskSubmission,
  pgGetTaskSubmission,
  TASK_SUBMISSION_MAX_BYTES,
} from "@/lib/task-submissions/task-submissions-store";

export interface SubmitTarefaInput {
  userId: string;
  cursoId: string;
  username: string;
  tarefaId: number;
  fileName: string;
  fileMime: string | null;
  fileBytes: Buffer;
  comment: string | null;
}

export interface SubmitTarefaResult {
  submissionId: string;
  status: "queued";
  message: string;
}

async function dispatchSubmitJob(input: {
  submissionId: string;
  username: string;
  passwordEnc: string;
}): Promise<void> {
  const config = resolveWorkerDispatchConfig();
  if (!config) {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Envio indisponível: worker Playwright offline.",
      503
    );
  }

  const response = await fetch(`${config.workerUrl}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.workerSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId: input.submissionId,
      robot: "submit-tarefa",
      username: input.username,
      passwordEnc: input.passwordEnc,
      submissionId: input.submissionId,
      execution: "async",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      "SIGAA_OFFLINE",
      text || "Falha ao despachar envio ao worker.",
      502
    );
  }
}

export async function submitTarefaToSigaa(
  input: SubmitTarefaInput
): Promise<SubmitTarefaResult> {
  if (input.fileBytes.length > TASK_SUBMISSION_MAX_BYTES) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Arquivo excede 10 MB (limite do SIGAA).",
      400
    );
  }

  const tarefa = await pgGetTarefaById(input.tarefaId);
  if (!tarefa) {
    throw new ApiError("NOT_FOUND", "Tarefa não encontrada.", 404);
  }
  if (tarefa.manual === 1) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tarefas manuais não podem ser enviadas ao SIGAA.",
      400
    );
  }
  if (tarefa.concluida === 1) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Esta tarefa já foi marcada como enviada.",
      400
    );
  }
  const linkId = tarefa.sigaa_link_id?.trim();
  if (!linkId) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tarefa sem vínculo SIGAA. Sincronize novamente.",
      400
    );
  }

  const credentials = await openServerSigaaCredentialsForWorker(input.username);
  const passwordEnc = sealServerSigaaPassword(credentials.password);

  const submission = await pgCreateTaskSubmission({
    userId: input.userId,
    cursoId: input.cursoId,
    tarefaId: input.tarefaId,
    sigaaLinkId: linkId,
    fileName: input.fileName,
    fileMime: input.fileMime,
    fileBytes: input.fileBytes,
    commentText: input.comment?.trim() || null,
  });

  try {
    await dispatchSubmitJob({
      submissionId: submission.id,
      username: input.username,
      passwordEnc,
    });
  } catch (error) {
    const { pgMarkTaskSubmissionFailed } = await import(
      "@/lib/task-submissions/task-submissions-store"
    );
    await pgMarkTaskSubmissionFailed(
      submission.id,
      error instanceof Error ? error.message : "Falha ao despachar."
    );
    throw error;
  }

  return {
    submissionId: submission.id,
    status: "queued",
    message: "Envio enfileirado. O robô está submetendo no SIGAA.",
  };
}

export async function getTaskSubmissionStatus(submissionId: string) {
  const row = await pgGetTaskSubmission(submissionId);
  if (!row) {
    throw new ApiError("NOT_FOUND", "Envio não encontrado.", 404);
  }
  return {
    submissionId: row.id,
    status: row.status,
    errorMessage: row.errorMessage,
    tarefaId: row.tarefaId,
  };
}

export { TASK_SUBMISSION_MAX_BYTES };
