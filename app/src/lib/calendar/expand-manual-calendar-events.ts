import {
  formatAcademicDateRange,
  formatIsoToBrDate,
} from "@/lib/calendar/academic-date-format";
import { encodeCalendarEventId } from "@/lib/calendar/calendar-event-id";
import {
  countIsoDaysInclusive,
  eachIsoDateInRange,
  isoDateToWeekdayIndex,
} from "@/lib/calendar/date-range";
import {
  formatRecurrenceDaysShort,
  parseRecurrenceDays,
} from "@/lib/calendar/recurrence-weekdays";
import { resolveSubjectShortLabel } from "@/lib/disciplinas/subject-display-name";
import type { CalendarEvent } from "@/lib/types/calendar";
import type { EventoCalendarioRow } from "@/lib/types/db";

const DEFAULT_EVENT_COLOR = "#D4A843";
const MAX_RECURRENCE_OCCURRENCES = 366;

function formatTimeSegment(
  timeStart?: string | null,
  timeEnd?: string | null
): string | null {
  const start = timeStart?.trim() || null;
  const end = timeEnd?.trim() || null;
  if (start && end && start !== end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return `até ${end}`;
  return null;
}

function buildManualEventDescription(row: EventoCalendarioRow): string {
  const custom = row.descricao?.trim();
  if (custom) return custom;

  const timeLabel = formatTimeSegment(row.hora_inicio, row.hora_fim);
  const recurrence = row.recorrencia ?? "none";

  if (recurrence === "weekly" && row.recorrencia_ate) {
    const daysLabel = formatRecurrenceDaysShort(row.recorrencia_dias);
    const range = formatAcademicDateRange(row.data, row.recorrencia_ate);
    return timeLabel
      ? `Repete ${daysLabel} — ${timeLabel}, de ${range}.`
      : `Repete ${daysLabel} de ${range}.`;
  }

  if (recurrence === "daily" && row.recorrencia_ate) {
    const range = formatAcademicDateRange(row.data, row.recorrencia_ate);
    return timeLabel
      ? `Evento diário — ${timeLabel}, de ${range}.`
      : `Evento diário de ${range}.`;
  }

  const end = row.data_fim && row.data_fim !== row.data ? row.data_fim : null;
  const range = end
    ? formatAcademicDateRange(row.data, end)
    : formatIsoToBrDate(row.data);

  return timeLabel
    ? `${row.titulo} — ${range} · ${timeLabel}.`
    : `${row.titulo} — ${range}.`;
}

function mapManualEventSharedFields(
  row: EventoCalendarioRow
): Pick<
  CalendarEvent,
  | "title"
  | "type"
  | "subject"
  | "subjectCode"
  | "color"
  | "description"
  | "done"
  | "manual"
  | "timeStart"
  | "timeEnd"
> {
  return {
    title: row.titulo,
    type: row.tipo,
    subject: row.disciplina_id
      ? resolveSubjectShortLabel(
          row.disciplina_id,
          row.disciplina_apelido,
          row.disciplina_nome
        )
      : undefined,
    subjectCode: row.disciplina_id ?? undefined,
    color: row.cor ?? DEFAULT_EVENT_COLOR,
    description: buildManualEventDescription(row),
    done: row.concluida === 1,
    manual: row.manual === 1,
    timeStart: row.hora_inicio ?? undefined,
    timeEnd: row.hora_fim ?? undefined,
  };
}

function expandDailyManualEvent(row: EventoCalendarioRow): CalendarEvent[] {
  if (!row.recorrencia_ate) return [];

  const totalDays = countIsoDaysInclusive(row.data, row.recorrencia_ate);
  const cappedEnd =
    totalDays > MAX_RECURRENCE_OCCURRENCES
      ? [...eachIsoDateInRange(row.data, row.recorrencia_ate)][
          MAX_RECURRENCE_OCCURRENCES - 1
        ]
      : row.recorrencia_ate;

  const shared = mapManualEventSharedFields(row);
  const events: CalendarEvent[] = [];

  for (const date of eachIsoDateInRange(row.data, cappedEnd ?? row.recorrencia_ate)) {
    events.push({
      ...shared,
      id: `${encodeCalendarEventId("evento", row.id)}-${date}`,
      date,
    });
  }

  return events;
}

function expandWeeklyManualEvent(row: EventoCalendarioRow): CalendarEvent[] {
  if (!row.recorrencia_ate) return [];

  const selectedDays = new Set(parseRecurrenceDays(row.recorrencia_dias));
  if (selectedDays.size === 0) return [];

  const shared = mapManualEventSharedFields(row);
  const events: CalendarEvent[] = [];

  for (const date of eachIsoDateInRange(row.data, row.recorrencia_ate)) {
    const weekday = isoDateToWeekdayIndex(date);
    if (weekday == null || !selectedDays.has(weekday)) continue;

    events.push({
      ...shared,
      id: `${encodeCalendarEventId("evento", row.id)}-${date}`,
      date,
    });

    if (events.length >= MAX_RECURRENCE_OCCURRENCES) break;
  }

  return events;
}

function expandSpanManualEvent(row: EventoCalendarioRow): CalendarEvent[] {
  const shared = mapManualEventSharedFields(row);
  const end =
    row.data_fim && row.data_fim !== row.data ? row.data_fim : undefined;

  return [
    {
      ...shared,
      id: encodeCalendarEventId("evento", row.id),
      date: row.data,
      dateEnd: end,
    },
  ];
}

/** Expande eventos manuais: intervalo, horário e recorrência. */
export function expandManualCalendarEvents(
  rows: EventoCalendarioRow[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const row of rows) {
    const recurrence = row.recorrencia ?? "none";

    if (recurrence === "daily") {
      events.push(...expandDailyManualEvent(row));
      continue;
    }

    if (recurrence === "weekly") {
      events.push(...expandWeeklyManualEvent(row));
      continue;
    }

    events.push(...expandSpanManualEvent(row));
  }

  return events;
}
