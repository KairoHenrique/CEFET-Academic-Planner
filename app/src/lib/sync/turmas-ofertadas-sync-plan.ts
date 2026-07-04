import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { getTurmasOfertadas } from "@/lib/db/queries";
import { shouldRefreshTurmasOfertadasOnSchedule } from "@/lib/sync/sync-preferences";

function turmasSemesterMismatch(referenceDate = new Date()): boolean {
  const target = resolveNextAcademicSemesterLabel(referenceDate);
  const rows = getTurmasOfertadas(target);
  return rows.length === 0;
}

export function shouldRunTurmasOfertadasSync(options?: {
  force?: boolean;
  referenceDate?: Date;
}): boolean {
  if (options?.force === true) return true;

  const referenceDate = options?.referenceDate ?? new Date();
  const target = resolveNextAcademicSemesterLabel(referenceDate);

  if (getTurmasOfertadas(target).length === 0) return true;
  if (turmasSemesterMismatch(referenceDate)) return true;
  if (shouldRefreshTurmasOfertadasOnSchedule()) return true;

  return false;
}
