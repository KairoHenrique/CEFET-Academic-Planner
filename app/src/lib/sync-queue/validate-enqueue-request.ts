import { validationError } from "@/lib/api/errors";
import { readEffectiveSyncPolicySync } from "@/lib/sync-policy/app-config-store";
import {
  normalizeSyncMode,
  resolveSyncModeForTrigger,
} from "@/lib/sync-policy/resolve-sync-mode";
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

  const trigger = parseTrigger(record.trigger ?? "manual");
  const policy = readEffectiveSyncPolicySync();
  const requestedMode =
    typeof record.mode === "string" ? record.mode : undefined;

  return {
    username,
    password,
    lane: parseLane(record.lane ?? "normal"),
    trigger,
    mode: resolveSyncModeForTrigger({
      trigger,
      requestedMode,
      buttonScope: policy.buttonScope,
    }),
    savePassword: record.savePassword === true,
    idempotencyKey:
      typeof record.idempotencyKey === "string"
        ? record.idempotencyKey.trim()
        : undefined,
    skipCooldown: record.skipCooldown === true,
  };
}
