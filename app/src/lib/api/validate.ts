import { validationError } from "./errors";
import type { SyncRequest } from "@/lib/types/sync";
import type {
  CreateCalendarEventBody,
  PatchCalendarEventBody,
} from "@/lib/types/calendar-api";
import { normalizeHexColor } from "@/lib/colors/palette";
import type {
  DisciplinaListFilter,
  PatchDisciplinaAppearanceBody,
  PatchFaltaBody,
  PatchNotasBody,
  PatchTarefaBody,
  CreateTarefaBody,
} from "@/lib/types/disciplinas-api";

const DISCIPLINA_FILTERS: DisciplinaListFilter[] = [
  "todas",
  "com_tarefas",
  "risco_faltas",
  "risco",
  "critico",
  "aprovados",
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
      nota_extra: record.nota_extra === true,
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

  if (action === "update_manual") {
    const id = record.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      throw validationError("ID da avaliação inválido.");
    }

    const avaliacaoNome =
      record.avaliacao_nome === undefined
        ? undefined
        : requireNonEmptyString(record.avaliacao_nome, "Nome da avaliação");

    const notaMaxima = record.nota_maxima;
    if (
      notaMaxima !== undefined &&
      (typeof notaMaxima !== "number" || Number.isNaN(notaMaxima))
    ) {
      throw validationError("Nota máxima inválida.");
    }

    const notaObtida = record.nota_obtida;
    if (
      notaObtida !== undefined &&
      notaObtida !== null &&
      (typeof notaObtida !== "number" || Number.isNaN(notaObtida))
    ) {
      throw validationError("Nota obtida inválida.");
    }

    return {
      action: "update_manual",
      id,
      avaliacao_nome: avaliacaoNome,
      nota_maxima: notaMaxima,
      nota_obtida: notaObtida as number | null | undefined,
      nota_extra:
        record.nota_extra === undefined
          ? undefined
          : record.nota_extra === true,
    };
  }

  if (action === "delete") {
    const id = record.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      throw validationError("ID da avaliação inválido.");
    }

    return { action: "delete", id };
  }

  throw validationError(
    'Ação inválida. Use "add", "update", "update_manual" ou "delete".'
  );
}

const FALTA_STATUS = new Set(["presente", "falta", "nao_registrada"]);

export function parsePatchFaltaBody(body: unknown): PatchFaltaBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const action = record.action;

  if (action !== "update") {
    throw validationError('Ação inválida. Use "update".');
  }

  const id = record.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw validationError("ID do registro de frequência inválido.");
  }

  const status = record.status;
  if (typeof status !== "string" || !FALTA_STATUS.has(status)) {
    throw validationError("Status de frequência inválido.");
  }

  return {
    action: "update",
    id,
    status: status as PatchFaltaBody["status"],
  };
}

export function parsePatchTarefaBody(body: unknown): PatchTarefaBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const action = record.action ?? "toggle";

  if (action === "toggle") {
    if (typeof record.concluida !== "boolean") {
      throw validationError("Campo concluida deve ser boolean.");
    }
    return { action: "toggle", concluida: record.concluida };
  }

  if (action === "delete") {
    return { action: "delete" };
  }

  if (action === "update") {
    const titulo =
      record.titulo === undefined
        ? undefined
        : requireNonEmptyString(record.titulo, "Título");

    if (record.data_fim !== undefined && typeof record.data_fim !== "string") {
      throw validationError("Data de entrega inválida.");
    }

    if (
      record.hora_fim !== undefined &&
      (typeof record.hora_fim !== "string" ||
        !/^\d{2}:\d{2}$/.test(record.hora_fim))
    ) {
      throw validationError("Hora de entrega inválida.");
    }

    const tipo = record.tipo;
    if (
      tipo !== undefined &&
      tipo !== "individual" &&
      tipo !== "grupo"
    ) {
      throw validationError("Tipo de tarefa inválido.");
    }

    return {
      action: "update",
      titulo,
      descricao:
        typeof record.descricao === "string" ? record.descricao : undefined,
      data_fim:
        typeof record.data_fim === "string" ? record.data_fim : undefined,
      hora_fim:
        typeof record.hora_fim === "string" ? record.hora_fim : undefined,
      tipo,
      possui_nota:
        typeof record.possui_nota === "boolean" ? record.possui_nota : undefined,
      concluida:
        typeof record.concluida === "boolean" ? record.concluida : undefined,
      pontuacao_maxima:
        record.pontuacao_maxima === null
          ? null
          : typeof record.pontuacao_maxima === "number"
            ? record.pontuacao_maxima
            : undefined,
    };
  }

  throw validationError('Ação inválida. Use "toggle", "update" ou "delete".');
}

export function parseCreateTarefaBody(body: unknown): CreateTarefaBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const titulo = requireNonEmptyString(record.titulo, "Título");
  const dataFim = requireNonEmptyString(record.data_fim, "Data de entrega");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
    throw validationError("Data de entrega deve estar no formato AAAA-MM-DD.");
  }

  const horaFim = record.hora_fim;
  if (
    horaFim !== undefined &&
    (typeof horaFim !== "string" || !/^\d{2}:\d{2}$/.test(horaFim))
  ) {
    throw validationError("Hora de entrega inválida.");
  }

  const tipo = record.tipo;
  if (tipo !== undefined && tipo !== "individual" && tipo !== "grupo") {
    throw validationError("Tipo de tarefa inválido.");
  }

  return {
    titulo,
    descricao:
      typeof record.descricao === "string" ? record.descricao : undefined,
    data_fim: dataFim,
    hora_fim: typeof horaFim === "string" ? horaFim : undefined,
    tipo,
    possui_nota:
      typeof record.possui_nota === "boolean" ? record.possui_nota : undefined,
    pontuacao_maxima:
      typeof record.pontuacao_maxima === "number"
        ? record.pontuacao_maxima
        : undefined,
  };
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

const CALENDAR_EVENT_TYPES = ["aula", "tarefa", "prova", "evento"] as const;

function parseIsoDate(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw validationError(`${fieldName} deve estar no formato AAAA-MM-DD.`);
  }
  return value;
}

function parseCalendarEventType(value: unknown): (typeof CALENDAR_EVENT_TYPES)[number] {
  if (
    typeof value !== "string" ||
    !CALENDAR_EVENT_TYPES.includes(value as (typeof CALENDAR_EVENT_TYPES)[number])
  ) {
    throw validationError("Tipo de evento inválido.");
  }
  return value as (typeof CALENDAR_EVENT_TYPES)[number];
}

function parseOptionalHexColor(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    throw validationError("Cor inválida. Use formato #RRGGBB.");
  }
  return normalized;
}

export function parseCreateCalendarEventBody(
  body: unknown
): CreateCalendarEventBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const title = requireNonEmptyString(record.title, "Título");
  const date = parseIsoDate(record.date, "Data");
  const type = parseCalendarEventType(record.type);

  const subjectCode =
    typeof record.subjectCode === "string" ? record.subjectCode.trim() : undefined;

  return {
    title,
    date,
    type,
    description:
      typeof record.description === "string" ? record.description : undefined,
    subjectCode: subjectCode || undefined,
    color: parseOptionalHexColor(record.color),
  };
}

export function parsePatchDisciplinaAppearanceBody(
  body: unknown
): PatchDisciplinaAppearanceBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const color = parseOptionalHexColor(record.color);
  if (!color) {
    throw validationError("Informe uma cor válida (#RRGGBB).");
  }

  return { color };
}

export function parsePatchCalendarEventBody(
  body: unknown
): PatchCalendarEventBody {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const action = record.action ?? "toggle";

  if (action === "toggle") {
    if (typeof record.done !== "boolean") {
      throw validationError("Campo done deve ser boolean.");
    }
    return { action: "toggle", done: record.done };
  }

  if (action === "delete") {
    return { action: "delete" };
  }

  if (action === "update") {
    const title =
      record.title === undefined
        ? undefined
        : requireNonEmptyString(record.title, "Título");

    const date =
      record.date === undefined
        ? undefined
        : parseIsoDate(record.date, "Data");

    const type =
      record.type === undefined ? undefined : parseCalendarEventType(record.type);

    let subjectCode: string | null | undefined;
    if (record.subjectCode === null) {
      subjectCode = null;
    } else if (typeof record.subjectCode === "string") {
      subjectCode = record.subjectCode.trim();
    }

    return {
      action: "update",
      title,
      description:
        typeof record.description === "string" ? record.description : undefined,
      date,
      type,
      subjectCode,
      color: typeof record.color === "string" ? record.color : undefined,
      done: typeof record.done === "boolean" ? record.done : undefined,
    };
  }

  throw validationError('Ação inválida. Use "toggle", "update" ou "delete".');
}
