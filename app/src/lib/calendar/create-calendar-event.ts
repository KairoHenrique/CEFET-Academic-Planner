import { notFoundError, validationError } from "@/lib/api/errors";
import { isAcademicTaskType } from "@/lib/calendar/event-types";
import { DEFAULT_EVENT_COLOR, pickRandomPaletteColor } from "@/lib/colors/palette";
import {
  getEventoCalendarioById,
  getSemestreAtualByCodigo,
  getTarefaCalendarByDisciplinaLatest,
  insertEventoCalendario,
  saveTarefa,
} from "@/lib/db/queries";
import { mapEventoRowToCalendarEvent, mapTarefaRowToCalendarEvent } from "./map-calendar-event";
import type { CalendarEvent } from "@/lib/types/calendar";
import type { CreateCalendarEventBody } from "@/lib/types/calendar-api";

function resolveSubject(subjectCode?: string) {
  if (!subjectCode?.trim()) {
    return { disciplinaId: null, nome: null, cor: null };
  }

  const semestre = getSemestreAtualByCodigo(subjectCode.trim());
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
  if (subjectCor) return subjectCor;
  return pickRandomPaletteColor();
}

function shouldCreateAsTarefa(body: CreateCalendarEventBody): boolean {
  return (
    isAcademicTaskType(body.type) &&
    Boolean(body.subjectCode?.trim()) &&
    !body.color
  );
}

function createAsTarefa(body: CreateCalendarEventBody): CalendarEvent {
  const subject = resolveSubject(body.subjectCode);
  if (!subject.disciplinaId) {
    throw validationError("Informe a disciplina para tarefas e provas.");
  }

  saveTarefa({
    disciplina_id: subject.disciplinaId,
    titulo: body.title.trim(),
    descricao: body.description?.trim() ?? "",
    data_inicio: null,
    data_fim: body.date,
    hora_fim: "23:59",
    tipo: "individual",
    possui_nota: body.type === "prova" ? 1 : 0,
    concluida: 0,
    manual: 1,
    instrucoes: null,
    entregaveis: null,
    pontuacao_maxima: null,
  });

  const latest = getTarefaCalendarByDisciplinaLatest(subject.disciplinaId);
  if (!latest) {
    throw validationError("Não foi possível criar o evento.");
  }

  return mapTarefaRowToCalendarEvent(latest);
}

function createAsEventoManual(body: CreateCalendarEventBody): CalendarEvent {
  const subject = body.subjectCode
    ? resolveSubject(body.subjectCode)
    : { disciplinaId: null, nome: null, cor: null };

  const eventoId = insertEventoCalendario({
    titulo: body.title.trim(),
    descricao: body.description?.trim() ?? "",
    data: body.date,
    tipo: body.type,
    disciplina_id: subject.disciplinaId,
    cor: resolveEventColor(body, subject.cor) ?? DEFAULT_EVENT_COLOR,
    concluida: 0,
    manual: 1,
  });

  const created = getEventoCalendarioById(eventoId);
  if (!created) {
    throw validationError("Não foi possível criar o evento.");
  }

  return mapEventoRowToCalendarEvent(created);
}

export function createCalendarEvent(body: CreateCalendarEventBody): CalendarEvent {
  if (shouldCreateAsTarefa(body)) {
    return createAsTarefa(body);
  }

  return createAsEventoManual(body);
}
