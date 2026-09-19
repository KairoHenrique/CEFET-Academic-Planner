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
  semestre?: string | null,
  now: Date = new Date()
): { dataInicio: string; dataFim: string } | null {
  const periodos = rows.filter((row) => /per[ií]odo letivo/i.test(row.evento));
  if (periodos.length === 0) return null;

  const toBounds = (row: CalendarioAcademicoRow) => ({
    dataInicio: row.data_inicio,
    dataFim: row.data_fim ?? row.data_inicio,
  });

  // Preferir o período que contém a data de hoje (ex.: ago/2026 → 2026.2).
  const today = formatLocalIsoDate(now);
  const containing = periodos.find((row) => {
    const end = row.data_fim ?? row.data_inicio;
    return row.data_inicio <= today && end >= today;
  });
  if (containing) return toBounds(containing);

  if (semestre) {
    const exact = periodos.find((row) => row.semestre === semestre);
    if (exact) return toBounds(exact);
  }

  // Fallback: semestre mais recente na tabela.
  const sorted = [...periodos].sort((left, right) =>
    String(left.semestre ?? "").localeCompare(String(right.semestre ?? ""))
  );
  return toBounds(sorted.at(-1)!);
}

function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
