import {
  clearCalendarioAcademico,
  getCalendarioAcademico,
  purgeInvalidCalendarioAcademico,
  saveCalendarioEvent,
} from "@/lib/db/queries";
import type { CalendarioAcademicoSnapshot } from "@/lib/scraper/types/calendario";
import {
  filterPersistableCalendarioEventos,
  isCalendarioSnapshotPersistable,
} from "@/lib/sync/calendario-snapshot-policy";

export interface PersistCalendarioResult {
  persisted: boolean;
  rowsWritten: number;
  reason?: string;
}

export function persistCalendarioSnapshot(
  snapshot: CalendarioAcademicoSnapshot
): PersistCalendarioResult {
  if (!isCalendarioSnapshotPersistable(snapshot)) {
    const purged = purgeInvalidCalendarioAcademico();
    const remaining = getCalendarioAcademico().length;
    return {
      persisted: false,
      rowsWritten: 0,
      reason:
        snapshot.unavailableReason ??
        (remaining > 0
          ? "Calendário indisponível — eventos institucionais anteriores preservados."
          : purged > 0
            ? "Calendário indisponível — registros inválidos removidos."
            : "Calendário indisponível ou vazio."),
    };
  }

  clearCalendarioAcademico();

  const eventos = filterPersistableCalendarioEventos(snapshot);

  for (const evento of eventos) {
    saveCalendarioEvent({
      evento: evento.evento,
      data_inicio: evento.dataInicio,
      data_fim: evento.dataFim,
      semestre: evento.semestre,
    });
  }

  console.info(
    `[calendario] Persistidos ${eventos.length} evento(s) (${snapshot.semestreAlvo.join(", ")}).`
  );

  return {
    persisted: true,
    rowsWritten: eventos.length,
  };
}
