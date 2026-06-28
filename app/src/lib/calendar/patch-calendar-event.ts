import { notFoundError, validationError } from "@/lib/api/errors";
import {
  deleteEventoCalendario,
  deleteTarefa,
  getEventoCalendarioById,
  getSemestreAtualByCodigo,
  getTarefaCalendarById,
  updateEventoCalendarioFields,
  updateTarefaConcluida,
  updateTarefaFields,
} from "@/lib/db/queries";
import { encodeCalendarEventId, parseCalendarEventId } from "./calendar-event-id";
import type {
  PatchCalendarEventBody,
  PatchCalendarEventResponse,
} from "@/lib/types/calendar-api";

function resolveSubjectCode(subjectCode: string) {
  const semestre = getSemestreAtualByCodigo(subjectCode.trim());
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }
  return semestre.disciplina_id;
}

function patchTarefaEvent(
  numericId: number,
  body: PatchCalendarEventBody
): PatchCalendarEventResponse {
  const tarefa = getTarefaCalendarById(numericId);
  if (!tarefa) {
    throw notFoundError("Evento não encontrado.");
  }

  const eventId = encodeCalendarEventId("tarefa", numericId);

  if (body.action === "toggle") {
    updateTarefaConcluida(numericId, body.done);
    return { id: eventId, done: body.done };
  }

  if (body.action === "delete") {
    if (tarefa.manual !== 1) {
      throw validationError("Apenas eventos manuais podem ser excluídos.");
    }
    if (deleteTarefa(numericId) === 0) {
      throw validationError("Não foi possível excluir o evento.");
    }
    return { id: eventId, deleted: true };
  }

  if (body.type !== undefined && body.type !== "tarefa" && body.type !== "prova") {
    throw validationError("Tarefas do calendário só aceitam tipo tarefa ou prova.");
  }

  const changes = updateTarefaFields(numericId, {
    titulo: body.title?.trim(),
    descricao: body.description?.trim(),
    data_fim: body.date,
    concluida: body.done === undefined ? undefined : body.done ? 1 : 0,
    possui_nota:
      body.type === undefined
        ? undefined
        : body.type === "prova"
          ? 1
          : 0,
  });

  if (changes === 0) {
    throw validationError("Nenhuma alteração informada.");
  }

  return { id: eventId, updated: true };
}

function patchManualEvento(
  numericId: number,
  body: PatchCalendarEventBody
): PatchCalendarEventResponse {
  const evento = getEventoCalendarioById(numericId);
  if (!evento) {
    throw notFoundError("Evento não encontrado.");
  }

  const eventId = encodeCalendarEventId("evento", numericId);

  if (body.action === "toggle") {
    updateEventoCalendarioFields(numericId, { concluida: body.done ? 1 : 0 });
    return { id: eventId, done: body.done };
  }

  if (body.action === "delete") {
    if (deleteEventoCalendario(numericId) === 0) {
      throw validationError("Não foi possível excluir o evento.");
    }
    return { id: eventId, deleted: true };
  }

  let disciplinaId: string | null | undefined;
  if (body.subjectCode === undefined) {
    disciplinaId = undefined;
  } else if (body.subjectCode === null) {
    disciplinaId = null;
  } else {
    disciplinaId = resolveSubjectCode(body.subjectCode);
  }

  const changes = updateEventoCalendarioFields(numericId, {
    titulo: body.title?.trim(),
    descricao: body.description?.trim(),
    data: body.date,
    tipo: body.type,
    disciplina_id: disciplinaId,
    cor: body.color,
    concluida: body.done === undefined ? undefined : body.done ? 1 : 0,
  });

  if (changes === 0) {
    throw validationError("Nenhuma alteração informada.");
  }

  return { id: eventId, updated: true };
}

export function patchCalendarEvent(
  rawId: string,
  body: PatchCalendarEventBody
): PatchCalendarEventResponse {
  const { source, numericId } = parseCalendarEventId(rawId);

  if (source === "academico") {
    throw validationError("Datas acadêmicas oficiais não podem ser alteradas.");
  }

  if (source === "tarefa") {
    return patchTarefaEvent(numericId, body);
  }

  return patchManualEvento(numericId, body);
}
