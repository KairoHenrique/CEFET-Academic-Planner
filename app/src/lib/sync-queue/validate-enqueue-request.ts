import { validationError } from "@/lib/api/errors";
import type {
  EnqueueSyncJobInput,
  SyncJobTrigger,
  SyncQueueLane,
} from "@/lib/sync-queue/types";

function parseLane(value: unknown): SyncQueueLane {
  if (value === "priority" || value === "normal") {
    return value;
  }

  throw validationError('Campo lane deve ser "priority" ou "normal".');
}

function parseTrigger(value: unknown): SyncJobTrigger {
  if (
    value === "first_login" ||
    value === "manual" ||
    value === "auto" ||
    value === "dev"
  ) {
    return value;
  }

  throw validationError(
    'Campo trigger deve ser "first_login", "manual", "auto" ou "dev".'
  );
}

export function parseEnqueueSyncQueueRequest(body: unknown): EnqueueSyncJobInput {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const username =
    typeof record.username === "string" ? record.username.trim() : "";
  const password =
    typeof record.password === "string" && record.password.length > 0
      ? record.password
      : undefined;

  if (!username) {
    throw validationError("Informe o usuário do SIGAA.");
  }

  return {
    username,
    password,
    lane: parseLane(record.lane ?? "normal"),
    trigger: parseTrigger(record.trigger ?? "manual"),
    mode: record.mode === "incremental" ? "incremental" : "full",
    savePassword: record.savePassword === true,
    idempotencyKey:
      typeof record.idempotencyKey === "string"
        ? record.idempotencyKey.trim()
        : undefined,
    skipCooldown: record.skipCooldown === true,
  };
}
