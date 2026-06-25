import { validationError } from "./errors";
import type { SyncRequest } from "@/lib/types/sync";
import type {
  DisciplinaListFilter,
  PatchNotasBody,
  PatchTarefaBody,
} from "@/lib/types/disciplinas-api";

const DISCIPLINA_FILTERS: DisciplinaListFilter[] = [
  "todas",
  "com_tarefas",
  "risco_faltas",
];

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

export function parseDisciplinaListParams(searchParams: URLSearchParams): {
  q: string;
  filter: DisciplinaListFilter;
} {
  const q = searchParams.get("q")?.trim() ?? "";
  const filterRaw = searchParams.get("filter") ?? "todas";

  const filter = DISCIPLINA_FILTERS.includes(filterRaw as DisciplinaListFilter)
    ? (filterRaw as DisciplinaListFilter)
    : "todas";

  return { q, filter };
}

function parseOptionalScore(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw validationError("Nota obtida inválida.");
  }
  return value;
}

export function parsePatchNotasBody(body: unknown): PatchNotasBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const action = record.action;

  if (action === "add") {
    const avaliacaoNome = requireNonEmptyString(
      record.avaliacao_nome,
      "Nome da avaliação"
    );
    const notaMaxima = record.nota_maxima;
    if (typeof notaMaxima !== "number" || Number.isNaN(notaMaxima)) {
      throw validationError("Nota máxima inválida.");
    }

    return {
      action: "add",
      avaliacao_nome: avaliacaoNome,
      nota_maxima: notaMaxima,
      nota_obtida: parseOptionalScore(record.nota_obtida),
    };
  }

  if (action === "update") {
    const id = record.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      throw validationError("ID da avaliação inválido.");
    }

    const notaObtida = record.nota_obtida;
    if (notaObtida !== null && (typeof notaObtida !== "number" || Number.isNaN(notaObtida))) {
      throw validationError("Nota obtida inválida.");
    }

    return {
      action: "update",
      id,
      nota_obtida: notaObtida as number | null,
    };
  }

  throw validationError('Ação inválida. Use "add" ou "update".');
}

export function parsePatchTarefaBody(body: unknown): PatchTarefaBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  if (typeof record.concluida !== "boolean") {
    throw validationError("Campo concluida deve ser boolean.");
  }

  return { concluida: record.concluida };
}

export function parsePositiveIntParam(
  value: string,
  fieldName: string
): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw validationError(`${fieldName} inválido.`);
  }
  return parsed;
}
