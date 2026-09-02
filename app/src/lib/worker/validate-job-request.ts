import { validationError } from "@/lib/api/errors";
import type { WorkerJobRequest } from "@/lib/worker/job-types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("Corpo JSON inválido.");
  }
  return value as Record<string, unknown>;
}

export function parseWorkerJobRequest(body: unknown): WorkerJobRequest {
  const record = asRecord(body);
  const jobId = typeof record.jobId === "string" ? record.jobId.trim() : "";
  const username =
    typeof record.username === "string" ? record.username.trim() : "";
  const password =
    typeof record.password === "string" ? record.password : undefined;
  const passwordEnc =
    typeof record.passwordEnc === "string" ? record.passwordEnc.trim() : undefined;

  if (!jobId) throw validationError("Campo jobId é obrigatório.");
  if (!username) throw validationError("Campo username é obrigatório.");
  if (!password?.length && !passwordEnc) {
    throw validationError("Informe passwordEnc (preferido) ou password.");
  }

  const robot =
    record.robot === "r1" ||
    record.robot === "turmas" ||
    record.robot === "calendario" ||
    record.robot === "turmas-selecionadas" ||
    record.robot === "submit-tarefa" ||
    record.robot === "ru"
      ? record.robot
      : null;
  if (!robot) {
    throw validationError(
      'Campo robot deve ser "r1", "turmas", "calendario", "turmas-selecionadas", "submit-tarefa" ou "ru".'
    );
  }

  const submissionId =
    typeof record.submissionId === "string"
      ? record.submissionId.trim()
      : undefined;
  if (robot === "submit-tarefa" && !submissionId) {
    throw validationError("Campo submissionId é obrigatório para submit-tarefa.");
  }

  const execution =
    record.execution === "async" ? ("async" as const) : ("sync" as const);

  const mode =
    typeof record.mode === "string"
      ? (["full", "lite", "deep", "incremental"] as const).includes(
          record.mode as "full"
        )
        ? (record.mode as WorkerJobRequest["mode"])
        : undefined
      : undefined;

  return {
    jobId,
    robot,
    username,
    password,
    passwordEnc,
    mode,
    savePassword: record.savePassword === true,
    execution,
    submissionId,
    dryRun: record.dryRun === true,
  };
}
