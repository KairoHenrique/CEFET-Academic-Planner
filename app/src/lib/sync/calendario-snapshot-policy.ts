import type { CalendarioAcademicoSnapshot } from "@/lib/scraper/types/calendario";
import { isValidCalendarioEventoLabel } from "@/lib/scraper/calendario/calendario-event-filter";

export function filterPersistableCalendarioEventos(
  snapshot: CalendarioAcademicoSnapshot
) {
  return snapshot.eventos.filter((evento) =>
    isValidCalendarioEventoLabel(evento.evento)
  );
}

export function isCalendarioSnapshotPersistable(
  snapshot: CalendarioAcademicoSnapshot
): boolean {
  if (snapshot.unavailable) return false;
  return filterPersistableCalendarioEventos(snapshot).length > 0;
}

export function countPersistableCalendarioEventos(
  snapshot: CalendarioAcademicoSnapshot
): number {
  return filterPersistableCalendarioEventos(snapshot).length;
}
