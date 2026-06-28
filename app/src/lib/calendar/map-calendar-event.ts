import { encodeCalendarEventId } from "./calendar-event-id";
import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarioAcademicoRow,
  EventoCalendarioRow,
  TarefaCalendarRow,
} from "@/lib/types/db";

const DEFAULT_EVENT_COLOR = "#D4A843";

function mapTarefaRow(row: TarefaCalendarRow): CalendarEvent {
  return {
    id: encodeCalendarEventId("tarefa", row.id),
    date: row.data_fim ?? row.data_inicio ?? "",
    title: row.titulo,
    type: row.possui_nota === 1 ? "prova" : "tarefa",
    subject: row.disciplina_nome,
    subjectCode: row.disciplina_id,
    color: row.cor ?? "#3AA0E8",
    description: row.descricao?.trim() || "Sem descrição.",
    done: row.concluida === 1,
    manual: row.manual === 1,
  };
}

function mapEventoManualRow(row: EventoCalendarioRow): CalendarEvent {
  return {
    id: encodeCalendarEventId("evento", row.id),
    date: row.data,
    title: row.titulo,
    type: row.tipo,
    subject: row.disciplina_nome ?? undefined,
    subjectCode: row.disciplina_id ?? undefined,
    color: row.cor ?? DEFAULT_EVENT_COLOR,
    description: row.descricao?.trim() || "Evento adicionado manualmente.",
    done: row.concluida === 1,
    manual: true,
  };
}

function mapAcademicoRow(row: CalendarioAcademicoRow): CalendarEvent {
  return {
    id: encodeCalendarEventId("academico", row.id),
    date: row.data_inicio,
    title: row.evento,
    type: "evento",
    color: DEFAULT_EVENT_COLOR,
    description: row.data_fim
      ? `${row.evento} — de ${row.data_inicio} até ${row.data_fim}.`
      : `${row.evento} — ${row.data_inicio}.`,
    done: false,
    manual: false,
  };
}

export function mapCalendarRowsToEvents(input: {
  tarefas: TarefaCalendarRow[];
  eventosManuais: EventoCalendarioRow[];
  academicos: CalendarioAcademicoRow[];
}): CalendarEvent[] {
  const events = [
    ...input.tarefas.map(mapTarefaRow),
    ...input.eventosManuais.map(mapEventoManualRow),
    ...input.academicos.map(mapAcademicoRow),
  ].filter((event) => event.date.length > 0);

  return events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function formatAcademicDateLabel(row: CalendarioAcademicoRow): string {
  const formatIso = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  };

  if (row.data_fim && row.data_fim !== row.data_inicio) {
    const start = formatIso(row.data_inicio).slice(0, 5);
    const end = formatIso(row.data_fim);
    return `${start} – ${end}`;
  }

  return formatIso(row.data_inicio);
}

export function mapTarefaRowToCalendarEvent(row: TarefaCalendarRow): CalendarEvent {
  return mapTarefaRow(row);
}

export function mapEventoRowToCalendarEvent(row: EventoCalendarioRow): CalendarEvent {
  return mapEventoManualRow(row);
}
