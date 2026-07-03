import {
  compareSemesterLabels,
  resolveAcademicSemesterDisplayPair,
} from "@/lib/academic/resolve-academic-semester";
import { formatInstitutionalEventLabel } from "@/lib/calendar/academic-date-format";
import { formatAcademicDateLabel } from "@/lib/calendar/map-calendar-event";
import type {
  AcademicDateItem,
  AcademicDateSemesterGroup,
} from "@/lib/types/calendar-api";
import type { CalendarioAcademicoRow } from "@/lib/types/db";

export { compareSemesterLabels };

export function buildAcademicDateGroups(
  rows: CalendarioAcademicoRow[]
): AcademicDateSemesterGroup[] {
  const bySemester = new Map<string, AcademicDateItem[]>();

  for (const row of rows) {
    const semestre = row.semestre?.trim();
    if (!semestre) continue;

    const items = bySemester.get(semestre) ?? [];
    items.push({
      label: formatInstitutionalEventLabel(row),
      date: formatAcademicDateLabel(row),
    });
    bySemester.set(semestre, items);
  }

  return [...bySemester.entries()]
    .sort(([left], [right]) => compareSemesterLabels(left, right))
    .map(([semestre, items]) => ({ semestre, items }));
}

/** Sempre retorna o par corrente + próximo semestre para o card acadêmico. */
export function buildAcademicDateDisplayGroups(
  rows: CalendarioAcademicoRow[],
  referenceDate = new Date()
): AcademicDateSemesterGroup[] {
  const bySemester = new Map(
    buildAcademicDateGroups(rows).map((group) => [group.semestre, group.items])
  );
  const [current, next] = resolveAcademicSemesterDisplayPair(referenceDate, rows);

  return [
    { semestre: current, items: bySemester.get(current) ?? [] },
    { semestre: next, items: bySemester.get(next) ?? [] },
  ];
}
