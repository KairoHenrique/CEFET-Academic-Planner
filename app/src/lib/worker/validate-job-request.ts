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

  const robot = record.robot === "r1" ? "r1" : null;
  if (!robot) {
    throw validationError('Campo robot deve ser "r1" (B54).');
  }

  const mode =
    record.mode === "incremental" || record.mode === "full"
      ? record.mode
      : undefined;

  return {
    jobId,
    robot,
    username,
    password,
    passwordEnc,
    mode,
    savePassword: record.savePassword === true,
  };
}
