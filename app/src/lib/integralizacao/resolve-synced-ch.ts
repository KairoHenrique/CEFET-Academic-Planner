import type { IntegralizacaoRow } from "@/lib/types/db";

/** Total exigido efetivo: prioriza PDF/SIGAA, mas nunca abaixo do catálogo PPC. */
export function resolveEffectiveTotalRequired(
  syncedRow: IntegralizacaoRow | undefined,
  catalogTotal: number
): number {
  const syncedTotal = syncedRow?.total_necessario ?? 0;
  return Math.max(syncedTotal, catalogTotal);
}

/**
 * Horas concluídas a partir da linha sincronizada.
 * Quando há pendente do SIGAA, deriva de total − pendente (corrige catálogo antigo 3080→3105).
 */
export function resolveSyncedConcluidoHours(
  syncedRow: IntegralizacaoRow | undefined,
  catalogTotal: number
): number | null {
  if (!syncedRow) return null;

  const total = resolveEffectiveTotalRequired(syncedRow, catalogTotal);
  if (syncedRow.pendente !== null && syncedRow.pendente >= 0) {
    return Math.max(0, total - syncedRow.pendente);
  }

  if (syncedRow.concluido !== null && syncedRow.concluido >= 0) {
    return syncedRow.concluido;
  }

  return null;
}

export function resolveSyncedPendenteHours(
  syncedRow: IntegralizacaoRow | undefined,
  catalogTotal: number,
  done: number
): number | null {
  if (
    syncedRow &&
    syncedRow.pendente !== null &&
    syncedRow.pendente >= 0
  ) {
    return syncedRow.pendente;
  }

  const total = resolveEffectiveTotalRequired(syncedRow, catalogTotal);
  return Math.max(0, total - done);
}
