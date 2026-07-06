import { randomUUID } from "node:crypto";
import { validationError } from "@/lib/api/errors";
import type {
  SimuladorChoquesRequestBody,
  SimuladorSaveSimulationRequestBody,
} from "@/lib/types/simulador-api";

const MAX_TURMAS = 24;
const MAX_TITLE_LENGTH = 80;

function assertStringArray(
  value: unknown,
  field: string,
  maxItems: number
): string[] {
  if (!Array.isArray(value)) {
    throw validationError(`${field} deve ser uma lista.`);
  }

  if (value.length > maxItems) {
    throw validationError(`${field} aceita no máximo ${maxItems} itens.`);
  }

  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      throw validationError(`${field} contém identificador inválido.`);
    }
    items.push(entry.trim());
  }

  return items;
}

export function parseElegibilidadeCodesParam(
  raw: string | null
): string[] | undefined {
  if (!raw?.trim()) return undefined;

  const codes = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (codes.length === 0) {
    throw validationError("Informe ao menos um código de disciplina.");
  }

  if (codes.length > 64) {
    throw validationError("Máximo de 64 códigos por consulta.");
  }

  return codes;
}

export function parseChoquesRequestBody(body: unknown): SimuladorChoquesRequestBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const turmaSigaaIds = assertStringArray(
    record.turmaSigaaIds,
    "turmaSigaaIds",
    MAX_TURMAS
  );

  let candidateTurmaSigaaId: string | undefined;
  if (record.candidateTurmaSigaaId !== undefined) {
    if (
      typeof record.candidateTurmaSigaaId !== "string" ||
      record.candidateTurmaSigaaId.trim().length === 0
    ) {
      throw validationError("candidateTurmaSigaaId inválido.");
    }
    candidateTurmaSigaaId = record.candidateTurmaSigaaId.trim();
  }

  return { turmaSigaaIds, candidateTurmaSigaaId };
}

export function parseSaveSimulationBody(
  body: unknown
): SimuladorSaveSimulationRequestBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const titulo =
    typeof record.titulo === "string" ? record.titulo.trim() : "";

  if (titulo.length < 2) {
    throw validationError("Informe um título com ao menos 2 caracteres.");
  }

  if (titulo.length > MAX_TITLE_LENGTH) {
    throw validationError(`Título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.`);
  }

  const turmaSigaaIds = assertStringArray(
    record.turmaSigaaIds,
    "turmaSigaaIds",
    MAX_TURMAS
  );

  if (turmaSigaaIds.length === 0) {
    throw validationError("Inclua ao menos uma turma na simulação.");
  }

  const semestre =
    typeof record.semestre === "string" && record.semestre.trim().length > 0
      ? record.semestre.trim()
      : undefined;

  return { titulo, turmaSigaaIds, semestre };
}

export function parseSimulationIdParam(raw: string): string {
  const id = raw.trim();
  if (!id) {
    throw validationError("Identificador da simulação inválido.");
  }
  if (id.length > 64) {
    throw validationError("Identificador da simulação inválido.");
  }
  return id;
}

export function createSimulationId(): string {
  return randomUUID();
}
