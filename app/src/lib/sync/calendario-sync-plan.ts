import { getCalendarioAcademico } from "@/lib/db/queries";
import {
  resolveAcademicSemesterLabel,
  resolveCalendarioSemesterTargets,
} from "@/lib/academic/resolve-academic-semester";
import { isValidCalendarioEventoLabel } from "@/lib/scraper/calendario/calendario-event-filter";
import { shouldRefreshCalendarioOnSchedule } from "@/lib/sync/sync-preferences";

function hasInvalidCalendarioRows(): boolean {
  return getCalendarioAcademico().some(
    (row) => !isValidCalendarioEventoLabel(row.evento)
  );
}

function calendarioSemesterMismatch(referenceDate = new Date()): boolean {
  const rows = getCalendarioAcademico();
  if (rows.length === 0) return true;

  const targets = new Set(resolveCalendarioSemesterTargets(referenceDate));
  const storedSemesters = new Set(
    rows
      .map((row) => row.semestre?.trim())
      .filter((value): value is string => Boolean(value))
  );

  if (storedSemesters.size === 0) return true;

  for (const semestre of targets) {
    if (!storedSemesters.has(semestre)) return true;
  }

  return false;
}

export function shouldRunCalendarioSync(options?: {
  force?: boolean;
  referenceDate?: Date;
}): boolean {
  if (options?.force === true) return true;

  const referenceDate = options?.referenceDate ?? new Date();

  if (hasInvalidCalendarioRows()) return true;
  if (getCalendarioAcademico().length === 0) return true;
  if (calendarioSemesterMismatch(referenceDate)) return true;
  if (shouldRefreshCalendarioOnSchedule()) return true;

  const primary = resolveAcademicSemesterLabel(referenceDate);
  const hasPrimary = getCalendarioAcademico().some(
    (row) => row.semestre === primary
  );

  return !hasPrimary;
}
