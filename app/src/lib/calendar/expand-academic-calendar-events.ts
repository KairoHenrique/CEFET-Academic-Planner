import {
  ACADEMIC_MILESTONE_FIM,
  ACADEMIC_MILESTONE_INICIO,
  formatAcademicDateRange,
  formatInstitutionalEventLabel,
  formatIsoToBrDate,
} from "@/lib/calendar/academic-date-format";
import { encodeCalendarEventId } from "@/lib/calendar/calendar-event-id";
import type { CalendarEvent } from "@/lib/types/calendar";
import type { CalendarioAcademicoRow } from "@/lib/types/db";

const DEFAULT_EVENT_COLOR = "#D4A843";

function buildAcademicMilestoneEvent(
  row: CalendarioAcademicoRow,
  date: string,
  suffix: typeof ACADEMIC_MILESTONE_INICIO | typeof ACADEMIC_MILESTONE_FIM | null,
  rangeLabel: string
): CalendarEvent {
  const eventLabel = formatInstitutionalEventLabel(row);
  const title = suffix ? `${eventLabel} — ${suffix}` : eventLabel;
  const id = suffix
    ? `academico-${row.id}-${suffix === ACADEMIC_MILESTONE_INICIO ? "inicio" : "fim"}`
    : encodeCalendarEventId("academico", row.id);

  const dateLabel = formatIsoToBrDate(date);

  return {
    id,
    date,
    title,
    type: "evento",
    color: DEFAULT_EVENT_COLOR,
    description: suffix
      ? `${eventLabel} — ${suffix} em ${dateLabel}. Período: ${rangeLabel}.`
      : `${eventLabel} — ${rangeLabel}.`,
    done: false,
    manual: false,
  };
}

/** Marca Início e Fim de cada período institucional (sem repetir todos os dias). */
export function expandAcademicRowsToCalendarEvents(
  rows: CalendarioAcademicoRow[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const row of rows) {
    const end = row.data_fim ?? row.data_inicio;
    const rangeLabel = formatAcademicDateRange(row.data_inicio, row.data_fim);

    if (end === row.data_inicio) {
      events.push(buildAcademicMilestoneEvent(row, row.data_inicio, null, rangeLabel));
      continue;
    }

    events.push(
      buildAcademicMilestoneEvent(row, row.data_inicio, ACADEMIC_MILESTONE_INICIO, rangeLabel),
      buildAcademicMilestoneEvent(row, end, ACADEMIC_MILESTONE_FIM, rangeLabel)
    );
  }

  return events;
}

export function findPeriodoLetivoBounds(
  rows: CalendarioAcademicoRow[],
  semestre?: string | null
): { dataInicio: string; dataFim: string } | null {
  const match = rows.find((row) => {
    if (!/per[ií]odo letivo/i.test(row.evento)) return false;
    if (semestre && row.semestre && row.semestre !== semestre) return false;
    return true;
  });

  if (!match) return null;

  return {
    dataInicio: match.data_inicio,
    dataFim: match.data_fim ?? match.data_inicio,
  };
}
