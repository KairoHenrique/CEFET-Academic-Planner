import { eachIsoDateInRange, isoDateToWeekdayIndex } from "@/lib/calendar/date-range";
import { findPeriodoLetivoBounds } from "@/lib/calendar/expand-academic-calendar-events";
import { resolveSubjectShortLabel } from "@/lib/disciplinas/subject-display-name";
import { parseSigaaCodigoHorario } from "@/lib/schedule/parse-sigaa-codigo";
import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarioAcademicoRow,
  SemestreAtualWithDisciplina,
} from "@/lib/types/db";
import { splitTimeSlot, timeSlots, weekDays } from "@/lib/types/schedule";

function encodeAulaEventId(
  disciplinaId: string,
  date: string,
  slotIdx: number
): string {
  const safeCode = disciplinaId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `aula-${safeCode}-${date}-${slotIdx}`;
}

function resolveTurmaBounds(
  row: SemestreAtualWithDisciplina,
  academicRows: CalendarioAcademicoRow[]
): { dataInicio: string; dataFim: string } | null {
  if (row.turma_data_inicio && row.turma_data_fim) {
    return {
      dataInicio: row.turma_data_inicio,
      dataFim: row.turma_data_fim,
    };
  }

  return findPeriodoLetivoBounds(academicRows, null);
}

/** Gera ocorrências de aula (dia + horário) até o fim da turma ou do período letivo. */
export function expandClassSessionEvents(input: {
  semestreRows: SemestreAtualWithDisciplina[];
  academicRows: CalendarioAcademicoRow[];
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const row of input.semestreRows) {
    if (!row.codigo_horario?.trim()) continue;

    const bounds = resolveTurmaBounds(row, input.academicRows);
    if (!bounds) continue;

    const positions = parseSigaaCodigoHorario(row.codigo_horario);
    if (positions.length === 0) continue;

    const subjectLabel = resolveSubjectShortLabel(
      row.disciplina_id,
      row.apelido,
      row.nome
    );
    const room = row.local_exibicao?.trim() || row.local?.trim() || "—";
    const color = row.cor ?? "#3AA0E8";

    for (const date of eachIsoDateInRange(bounds.dataInicio, bounds.dataFim)) {
      const weekdayIdx = isoDateToWeekdayIndex(date);
      if (weekdayIdx == null || weekdayIdx > 4) continue;

      for (const position of positions) {
        if (position.dayIdx !== weekdayIdx) continue;

        const slotLabel = timeSlots[position.slotIdx];
        if (!slotLabel) continue;

        const { start, end } = splitTimeSlot(slotLabel);
        const weekdayName = weekDays[position.dayIdx];

        events.push({
          id: encodeAulaEventId(row.disciplina_id, date, position.slotIdx),
          date,
          title: `${subjectLabel} · ${start}`,
          type: "aula",
          subject: subjectLabel,
          subjectCode: row.disciplina_id,
          color,
          description: `Aula de ${subjectLabel} — ${weekdayName}, ${start}–${end}. Sala ${room}.`,
          done: false,
          manual: false,
        });
      }
    }
  }

  return events.sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return left.title.localeCompare(right.title, "pt-BR");
  });
}
