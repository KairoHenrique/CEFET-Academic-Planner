import type { TurmasOfertadasSnapshot } from "@/lib/scraper/types/turmas-ofertadas";

export function isTurmasOfertadasSnapshotPersistable(
  snapshot: TurmasOfertadasSnapshot
): boolean {
  if (snapshot.unavailable) return false;
  return snapshot.turmas.length > 0;
}
