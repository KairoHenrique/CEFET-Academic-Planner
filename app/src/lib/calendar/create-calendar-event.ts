import { notFoundError, validationError } from "@/lib/api/errors";
import { isAcademicTaskType } from "@/lib/calendar/event-types";
import { expandManualCalendarEvents } from "@/lib/calendar/expand-manual-calendar-events";
import { DEFAULT_EVENT_COLOR } from "@/lib/colors/palette";
import { resolveDefaultEventColor } from "@/lib/colors/event-type-colors";
import { serializeRecurrenceDays } from "@/lib/calendar/recurrence-weekdays";
import {
  mGetEventoCalendarioById,
  mGetSemestreAtualByCodigo,
  mGetTarefaCalendarById,
  mInsertEventoCalendario,
  mInsertTarefa,
} from "@/lib/db/mutations/mutation-ports";
import { mapTarefaRowToCalendarEvent } from "./map-calendar-event";
import type { CalendarEvent } from "@/lib/types/calendar";
import type { CreateCalendarEventBody } from "@/lib/types/calendar-api";

async function resolveSubject(subjectCode?: string) {
  if (!subjectCode?.trim()) {
    return { disciplinaId: null, nome: null, cor: null };
  }

  const semestre = await mGetSemestreAtualByCodigo(subjectCode.trim());
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  return {
    disciplinaId: semestre.disciplina_id,
    nome: semestre.nome,
    cor: semestre.cor,
  };
}

function resolveEventColor(
  body: CreateCalendarEventBody,
  subjectCor: string | null
): string {
  if (body.color) return body.color;
  return resolveDefaultEventColor(body.type, subjectCor);
}

function shouldCreateAsTarefa(body: CreateCalendarEventBody): boolean {
  return (
    body.recurrence !== "daily" &&
    body.recurrence !== "weekly" &&
    !(body.dateEnd && body.dateEnd !== body.date) &&
    isAcademicTaskType(body.type) &&
    Boolean(body.subjectCode?.trim()) &&
    !body.color
  );
}

function resolveManualSpanEnd(body: CreateCalendarEventBody): string | null {
  if (body.recurrence === "daily" || body.recurrence === "weekly") return null;
  if (!body.dateEnd || body.dateEnd === body.date) return null;
  return body.dateEnd;
}

async function createAsTarefa(body: CreateCalendarEventBody): Promise<CalendarEvent> {
  const subject = await resolveSubject(body.subjectCode);
  if (!subject.disciplinaId) {
    throw validationError("Informe a disciplina para tarefas e provas.");
  }

  const createdId = await mInsertTarefa({
    disciplina_id: subject.disciplinaId,
    titulo: body.title.trim(),
    descricao: body.description?.trim() ?? "",
    data_inicio: body.date,
    data_fim: body.dateEnd ?? body.date,
    hora_fim: body.timeEnd ?? body.timeStart ?? "23:59",
    tipo: "individual",
    possui_nota: body.type === "prova" ? 1 : 0,
    concluida: 0,
    manual: 1,
    instrucoes: null,
    entregaveis: null,
    pontuacao_maxima: null,
  });

  const created = await mGetTarefaCalendarById(createdId);
  if (!created) {
    throw validationError("Não foi possível criar o evento.");
  }

  const mapped = mapTarefaRowToCalendarEvent(created);
  return {
    ...mapped,
    timeStart: body.timeStart,
    timeEnd: body.timeEnd ?? body.timeStart,
  };
}

async function createAsEventoManual(
  body: CreateCalendarEventBody
): Promise<CalendarEvent> {
  const subject = body.subjectCode
    ? await resolveSubject(body.subjectCode)
    : { disciplinaId: null, nome: null, cor: null };

  const recurrence =
    body.recurrence === "weekly"
      ? "weekly"
      : body.recurrence === "daily"
        ? "daily"
        : "none";

  const eventoId = await mInsertEventoCalendario({
    titulo: body.title.trim(),
    descricao: body.description?.trim() ?? "",
    data: body.date,
    data_fim: resolveManualSpanEnd(body),
    hora_inicio: body.timeStart ?? null,
    hora_fim: body.timeEnd ?? null,
    recorrencia: recurrence,
    recorrencia_ate:
      recurrence === "weekly"
        ? body.dateEnd ?? null
        : recurrence === "daily"
          ? body.recurrenceUntil ?? null
          : null,
    recorrencia_dias:
      recurrence === "weekly" && body.recurrenceDays?.length
        ? serializeRecurrenceDays(body.recurrenceDays)
        : null,
    tipo: body.type,
    disciplina_id: subject.disciplinaId,
    cor: resolveEventColor(body, subject.cor) ?? DEFAULT_EVENT_COLOR,
    concluida: 0,
    manual: 1,
  });

  const created = await mGetEventoCalendarioById(eventoId);
  if (!created) {
    throw validationError("Não foi possível criar o evento.");
  }

  const [expanded] = expandManualCalendarEvents([created]);
  if (!expanded) {
    throw validationError("Não foi possível criar o evento.");
  }

  return expanded;
}

export async function createCalendarEvent(
  body: CreateCalendarEventBody
): Promise<CalendarEvent> {
  if (shouldCreateAsTarefa(body)) {
    return createAsTarefa(body);
  }

  return createAsEventoManual(body);
}
