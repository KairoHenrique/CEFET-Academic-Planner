import { validationError } from "@/lib/api/errors";
import { isAppCursoId } from "@/lib/auth/account/curso-catalog";
import { isValidCpf, normalizeCpf } from "@/lib/auth/account/cpf";
import {
  isValidEmail,
  isValidTelefone,
  normalizeEmail,
  normalizeTelefone,
} from "@/lib/auth/account/contact-fields";
import type { LoginAccountInput, RegisterAccountInput } from "@/lib/auth/account/types";

function readStringField(
  body: Record<string, unknown>,
  field: string
): string {
  const value = body[field];
  if (typeof value !== "string") {
    throw validationError(`Campo "${field}" é obrigatório.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError(`Campo "${field}" é obrigatório.`);
  }

  return trimmed;
}

export function parseRegisterAccountRequest(
  body: unknown
): RegisterAccountInput {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const payload = body as Record<string, unknown>;
  const email = normalizeEmail(readStringField(payload, "email"));
  const telefone = normalizeTelefone(readStringField(payload, "telefone"));
  const cpf = normalizeCpf(readStringField(payload, "cpf"));
  const cursoIdRaw = readStringField(payload, "cursoId");
  const password = readStringField(payload, "password");

  if (!isValidEmail(email)) {
    throw validationError("E-mail inválido.");
  }

  if (!isValidTelefone(telefone)) {
    throw validationError("Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
  }

  if (!isValidCpf(cpf)) {
    throw validationError("CPF inválido.");
  }

  if (!isAppCursoId(cursoIdRaw)) {
    throw validationError("Curso inválido.");
  }

  if (password.length < 4) {
    throw validationError("Senha SIGAA muito curta.");
  }

  return {
    email,
    telefone,
    cpf,
    cursoId: cursoIdRaw,
    password,
  };
}

export function parseLoginAccountRequest(body: unknown): LoginAccountInput {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const payload = body as Record<string, unknown>;
  const cpf = normalizeCpf(readStringField(payload, "cpf"));
  const password = readStringField(payload, "password");

  if (!isValidCpf(cpf)) {
    throw validationError("CPF inválido.");
  }

  if (password.length < 4) {
    throw validationError("Senha inválida.");
  }

  return { cpf, password };
}
