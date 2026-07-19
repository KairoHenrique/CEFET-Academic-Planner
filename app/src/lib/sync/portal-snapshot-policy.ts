import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

/**
 * Snapshot mínimo para replace seguro dos dados do portal.
 * Semestre sem turmas (SIGAA: "Nenhuma turma neste semestre") é válido
 * quando a matrícula está presente — limpa o semestre anterior.
 */
export function isPortalSnapshotPersistable(
  snapshot: PortalDiscenteSnapshot
): boolean {
  const matricula = snapshot.aluno?.matricula?.trim();
  return Boolean(matricula);
}

/** Portal autenticado com zero turmas no semestre atual. */
export function isPortalSemesterEmpty(
  snapshot: PortalDiscenteSnapshot
): boolean {
  return isPortalSnapshotPersistable(snapshot) && snapshot.semestreAtual.length === 0;
}
