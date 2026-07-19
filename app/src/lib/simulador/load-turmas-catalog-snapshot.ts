import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  getAllNotas,
  getDisciplinas,
  getHistorico,
  getIntegralizacao,
  getRequisitos,
  getSemestreAtual,
  getTurmasOfertadas,
} from "@/lib/db/queries";
import { isPostgresBackend } from "@/lib/db/backend/config";
import * as pg from "@/lib/db/postgres/queries-read";
import { attachUniqueShortLabels } from "@/lib/disciplinas/attach-unique-short-labels";
import { getTurmasOfertadasLastAt } from "@/lib/sync/sync-preferences";
import type {
  TurmaOfertadaCourse,
  TurmasOfertadasEnrollmentContext,
} from "@/lib/types/turmas-ofertadas-api";
import { applyCorequisitoOfferGate } from "@/lib/turmas-ofertadas/apply-corequisito-offer-gate";
import {
  assembleTurmasEnrollmentContext,
  serializeEnrollmentContextForClient,
} from "@/lib/turmas-ofertadas/assemble-turmas-enrollment-context";
import { dedupeTurmaOfertadaCourses } from "@/lib/turmas-ofertadas/dedupe-turma-ofertada-courses";
import { mapTurmaRowToCourse } from "@/lib/turmas-ofertadas/map-turma-offer-to-course";

export interface TurmasCatalogSnapshot {
  semestre: string;
  syncedAt: string | null;
  courses: TurmaOfertadaCourse[];
  enrollmentContext: TurmasOfertadasEnrollmentContext;
}

function mapRowsToCourses(
  rows: ReturnType<typeof getTurmasOfertadas>,
  context: ReturnType<typeof assembleTurmasEnrollmentContext>
): TurmaOfertadaCourse[] {
  const gated = applyCorequisitoOfferGate(
    dedupeTurmaOfertadaCourses(rows.map((row) => mapTurmaRowToCourse(row, context)))
  );
  return attachUniqueShortLabels(gated);
}

export function loadTurmasCatalogSnapshot(
  referenceDate = new Date()
): TurmasCatalogSnapshot {
  const semestre = resolveNextAcademicSemesterLabel(referenceDate);
  const rows = getTurmasOfertadas(semestre);
  const context = assembleTurmasEnrollmentContext({
    disciplinas: getDisciplinas(),
    historico: getHistorico(),
    semestreAtual: getSemestreAtual(),
    requisitos: getRequisitos(),
    integralizacaoRows: getIntegralizacao(),
    notas: getAllNotas(),
  });

  return {
    semestre,
    syncedAt:
      rows.find((row) => row.synced_at)?.synced_at ??
      getTurmasOfertadasLastAt(),
    courses: mapRowsToCourses(rows, context),
    enrollmentContext: serializeEnrollmentContextForClient(context),
  };
}

export async function loadTurmasCatalogSnapshotAsync(
  referenceDate = new Date()
): Promise<TurmasCatalogSnapshot> {
  const semestre = resolveNextAcademicSemesterLabel(referenceDate);
  const [
    disciplinas,
    historico,
    semestreAtual,
    requisitos,
    integralizacaoRows,
    rows,
    notas,
  ] = await Promise.all([
    pg.pgGetDisciplinas(),
    pg.pgGetHistorico(),
    pg.pgGetSemestreAtual(),
    pg.pgGetRequisitos(),
    pg.pgGetIntegralizacao(),
    pg.pgGetTurmasOfertadas(semestre),
    pg.pgGetAllNotas(),
  ]);

  const context = assembleTurmasEnrollmentContext({
    disciplinas,
    historico,
    semestreAtual,
    requisitos,
    integralizacaoRows,
    notas,
  });

  return {
    semestre,
    syncedAt: rows.find((row) => row.synced_at)?.synced_at ?? null,
    courses: mapRowsToCourses(rows, context),
    enrollmentContext: serializeEnrollmentContextForClient(context),
  };
}

export async function resolveTurmasCatalogSnapshot(
  referenceDate = new Date()
): Promise<TurmasCatalogSnapshot> {
  if (isPostgresBackend()) {
    return loadTurmasCatalogSnapshotAsync(referenceDate);
  }
  return loadTurmasCatalogSnapshot(referenceDate);
}
