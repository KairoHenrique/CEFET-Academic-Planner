import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

/** Snapshot mínimo para replace seguro dos dados do portal. */
export function isPortalSnapshotPersistable(
  snapshot: PortalDiscenteSnapshot
): boolean {
  const matricula = snapshot.aluno?.matricula?.trim();
  if (!matricula) return false;
  return snapshot.semestreAtual.length > 0;
}
