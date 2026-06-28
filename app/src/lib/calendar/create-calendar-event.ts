import { notFoundError, validationError } from "@/lib/api/errors";
import {
  getEventoCalendarioById,
  getSemestreAtualByCodigo,
  getTarefaCalendarByDisciplinaLatest,
  getTarefaCalendarById,
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
    cor: body.color ?? subject.cor ?? "#D4A843",
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
  const hasSubject = Boolean(body.subjectCode?.trim());

  if ((body.type === "tarefa" || body.type === "prova") && hasSubject) {
    return createAsTarefa(body);
  }

  return createAsEventoManual(body);
}
