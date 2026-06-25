import { validationError } from "./errors";
import type { SyncRequest } from "@/lib/types/sync";

export function parseSyncRequest(body: unknown): SyncRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const username = record.username;
  const password = record.password;

  if (typeof username !== "string" || username.trim().length === 0) {
    throw validationError("Informe o usuário do SIGAA.");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw validationError("Informe a senha do SIGAA.");
  }

  return {
    username: username.trim(),
    password,
  };
}

export function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationError(`${fieldName} é obrigatório.`);
  }
  return value.trim();
}
