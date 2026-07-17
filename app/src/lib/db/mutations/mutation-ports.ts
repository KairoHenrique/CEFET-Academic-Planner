import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  deleteEventoCalendario,
  deleteNota,
  deleteTarefa,
  getEventoCalendarioById,
  getFaltaById,
  getFaltasByDisciplina,
  getNotaById,
  getNotasByDisciplina,
  getSemestreAtualByCodigo,
  getTarefaById,
  getTarefaCalendarByDisciplinaLatest,
  getTarefaCalendarById,
  getTarefasByDisciplina,
  insertEventoCalendario,
  notaNomeExists,
  saveNota,
  saveTarefa,
  updateEventoCalendarioFields,
  updateFaltaStatus,
  updateNotaFields,
  updateNotaScore,
  updateSemestreAtualAppearance,
  updateTarefaConcluida,
  updateTarefaFields,
} from "@/lib/db/queries";
import * as pgw from "@/lib/db/postgres/queries-write";
import {
  pgGetFaltasByDisciplina,
  pgGetNotasByDisciplina,
  pgGetSemestreAtualByCodigo,
  pgGetTarefasByDisciplina,
} from "@/lib/db/postgres/queries-read";
import type {
  EventoCalendarioRow,
  FaltaRow,
  NotaRow,
  SemestreAtualWithDisciplina,
  TarefaCalendarRow,
  TarefaRow,
} from "@/lib/types/db";

const isPg = () => isPostgresBackend();

// --- Compartilhado ---
export function mGetSemestreAtualByCodigo(
  code: string
): Promise<SemestreAtualWithDisciplina | undefined> {
  return isPg()
    ? pgGetSemestreAtualByCodigo(code)
    : Promise.resolve(getSemestreAtualByCodigo(code));
}

// --- Notas ---
export function mGetNotasByDisciplina(id: string): Promise<NotaRow[]> {
  return isPg()
    ? pgGetNotasByDisciplina(id)
    : Promise.resolve(getNotasByDisciplina(id));
}

export function mGetNotaById(id: number): Promise<NotaRow | undefined> {
  return isPg() ? pgw.pgGetNotaById(id) : Promise.resolve(getNotaById(id));
}

export function mNotaNomeExists(
  disciplinaId: string,
  nome: string,
  excludeId?: number
): Promise<boolean> {
  return isPg()
    ? pgw.pgNotaNomeExists(disciplinaId, nome, excludeId)
    : Promise.resolve(notaNomeExists(disciplinaId, nome, excludeId));
}

export function mInsertNota(input: pgw.InsertNotaInput): Promise<void> {
  if (isPg()) return pgw.pgInsertNota(input);
  saveNota(input);
  return Promise.resolve();
}

export function mUpdateNotaScore(
  id: number,
  notaObtida: number | null
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateNotaScore(id, notaObtida)
    : Promise.resolve(updateNotaScore(id, notaObtida));
}

export function mUpdateNotaFields(
  id: number,
  fields: pgw.UpdateNotaFields
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateNotaFields(id, fields)
    : Promise.resolve(updateNotaFields(id, fields));
}

export function mDeleteNota(id: number): Promise<number> {
  return isPg() ? pgw.pgDeleteNota(id) : Promise.resolve(deleteNota(id));
}

// --- Faltas ---
export function mGetFaltaById(id: number): Promise<FaltaRow | undefined> {
  return isPg() ? pgw.pgGetFaltaById(id) : Promise.resolve(getFaltaById(id));
}

export function mGetFaltasByDisciplina(id: string): Promise<FaltaRow[]> {
  return isPg()
    ? pgGetFaltasByDisciplina(id)
    : Promise.resolve(getFaltasByDisciplina(id));
}

export function mUpdateFaltaStatus(
  id: number,
  status: FaltaRow["status"]
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateFaltaStatus(id, status)
    : Promise.resolve(updateFaltaStatus(id, status));
}

// --- Tarefas ---
export function mGetTarefaById(id: number): Promise<TarefaRow | undefined> {
  return isPg() ? pgw.pgGetTarefaById(id) : Promise.resolve(getTarefaById(id));
}

export function mGetTarefasByDisciplina(id: string): Promise<TarefaRow[]> {
  return isPg()
    ? pgGetTarefasByDisciplina(id)
    : Promise.resolve(getTarefasByDisciplina(id));
}

export async function mInsertTarefa(input: pgw.InsertTarefaInput): Promise<number> {
  if (isPg()) return pgw.pgInsertTarefa(input);
  saveTarefa(input);
  const latest = getTarefaCalendarByDisciplinaLatest(input.disciplina_id);
  if (!latest) {
    throw new Error("Falha ao recuperar a tarefa recém-criada.");
  }
  return latest.id;
}

export function mUpdateTarefaFields(
  id: number,
  fields: pgw.UpdateTarefaFields
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateTarefaFields(id, fields)
    : Promise.resolve(updateTarefaFields(id, fields));
}

export function mUpdateTarefaConcluida(
  id: number,
  concluida: boolean
): Promise<void> {
  if (isPg()) {
    return pgw.pgUpdateTarefaConcluida(id, concluida).then(() => undefined);
  }
  updateTarefaConcluida(id, concluida);
  return Promise.resolve();
}

export function mDeleteTarefa(id: number): Promise<number> {
  return isPg() ? pgw.pgDeleteTarefa(id) : Promise.resolve(deleteTarefa(id));
}

// --- Aparência (semestre_atual) ---
export function mUpdateSemestreAtualAppearance(
  disciplinaId: string,
  fields: pgw.UpdateAppearanceFields
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateSemestreAtualAppearance(disciplinaId, fields)
    : Promise.resolve(updateSemestreAtualAppearance(disciplinaId, fields));
}

// --- Calendário ---
export function mInsertEventoCalendario(
  input: pgw.InsertEventoInput
): Promise<number> {
  return isPg()
    ? pgw.pgInsertEventoCalendario(input)
    : Promise.resolve(insertEventoCalendario(input));
}

export function mGetEventoCalendarioById(
  id: number
): Promise<EventoCalendarioRow | undefined> {
  return isPg()
    ? pgw.pgGetEventoCalendarioById(id)
    : Promise.resolve(getEventoCalendarioById(id));
}

export function mUpdateEventoCalendarioFields(
  id: number,
  fields: pgw.UpdateEventoFields
): Promise<number> {
  return isPg()
    ? pgw.pgUpdateEventoCalendarioFields(id, fields)
    : Promise.resolve(updateEventoCalendarioFields(id, fields));
}

export function mDeleteEventoCalendario(id: number): Promise<number> {
  return isPg()
    ? pgw.pgDeleteEventoCalendario(id)
    : Promise.resolve(deleteEventoCalendario(id));
}

export function mGetTarefaCalendarById(
  id: number
): Promise<TarefaCalendarRow | undefined> {
  return isPg()
    ? pgw.pgGetTarefaCalendarById(id)
    : Promise.resolve(getTarefaCalendarById(id));
}

export function mGetTarefaCalendarByDisciplinaLatest(
  id: string
): Promise<TarefaCalendarRow | undefined> {
  return isPg()
    ? pgw.pgGetTarefaCalendarByDisciplinaLatest(id)
    : Promise.resolve(getTarefaCalendarByDisciplinaLatest(id));
}
