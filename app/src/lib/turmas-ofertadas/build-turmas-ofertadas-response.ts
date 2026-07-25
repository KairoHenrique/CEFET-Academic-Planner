import {
  loadTurmasCatalogSnapshot,
  resolveTurmasCatalogSnapshot,
  type TurmasCatalogSnapshot,
} from "@/lib/simulador/load-turmas-catalog-snapshot";
import type { TurmasOfertadasResponse } from "@/lib/types/turmas-ofertadas-api";

function snapshotToResponse(snapshot: TurmasCatalogSnapshot): TurmasOfertadasResponse {
  const curso = snapshot.courses.filter((item) => item.categoria === "curso");
  const optativas = snapshot.courses.filter(
    (item) => item.categoria === "optativa" || item.categoria === "outros"
  );

  return {
    semestre: snapshot.semestre,
    syncedAt: snapshot.syncedAt,
    enrollmentContext: snapshot.enrollmentContext,
    curso,
    optativas,
    courses: snapshot.courses,
    empty: snapshot.courses.length === 0,
  };
}

export function buildTurmasOfertadasResponse(
  referenceDate = new Date()
): TurmasOfertadasResponse {
  return snapshotToResponse(loadTurmasCatalogSnapshot(referenceDate));
}

export async function buildTurmasOfertadasResponseAsync(
  referenceDate = new Date()
): Promise<TurmasOfertadasResponse> {
  const snapshot = await resolveTurmasCatalogSnapshot(referenceDate);
  return snapshotToResponse(snapshot);
}
