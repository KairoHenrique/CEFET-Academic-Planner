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
  /** Abre/valida no SIGAA sem clicar em Enviar. */
  dryRun?: boolean;
}

export interface SubmitTarefaResult {
  submissionId: string;
  status: "queued" | "device_required";
  message: string;
  dryRun?: boolean;
  /** Quando o PC worker está offline — cliente envia no aparelho. */
  deviceRequired?: boolean;
  sigaaLinkId?: string;
  tarefaTitulo?: string;
}

const WORKER_OFFLINE_MESSAGE =
  "Não foi possível enviar agora. Tente novamente em alguns minutos.";

async function assertWorkerReachable(workerUrl: string): Promise<void> {
  try {
    const response = await fetch(`${workerUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new ApiError("SIGAA_OFFLINE", WORKER_OFFLINE_MESSAGE, 503);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("SIGAA_OFFLINE", WORKER_OFFLINE_MESSAGE, 503);
  }
}

async function dispatchSubmitJob(input: {
  submissionId: string;
  username: string;
  passwordEnc: string;
  dryRun?: boolean;
}): Promise<void> {
  const config = resolveWorkerDispatchConfig();
  if (!config) {
    throw new ApiError("SIGAA_OFFLINE", WORKER_OFFLINE_MESSAGE, 503);
  }

  await assertWorkerReachable(config.workerUrl);

  let response: Response;
  try {
    response = await fetch(`${config.workerUrl}/jobs`, {
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
        dryRun: input.dryRun === true,
        dbUrl: process.env.DATABASE_URL?.trim() || undefined,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiError("SIGAA_OFFLINE", WORKER_OFFLINE_MESSAGE, 503);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(
      "SIGAA_OFFLINE",
      text || WORKER_OFFLINE_MESSAGE,
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
  if (tarefa.concluida === 1 && !input.dryRun) {
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
      dryRun: input.dryRun === true,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === "SIGAA_OFFLINE" || error.status === 503)
    ) {
      // Cliente (app) completa o envio no aparelho — sem scrape no CF.
      return {
        submissionId: submission.id,
        status: "device_required",
        deviceRequired: true,
        sigaaLinkId: linkId,
        tarefaTitulo: tarefa.titulo,
        dryRun: input.dryRun === true,
        message: "Preparando envio…",
      };
    }
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
    dryRun: input.dryRun === true,
    message: input.dryRun
      ? "Validação enfileirada. O robô vai abrir a tarefa no SIGAA sem enviar."
      : "Envio enfileirado. O robô está submetendo no SIGAA.",
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
