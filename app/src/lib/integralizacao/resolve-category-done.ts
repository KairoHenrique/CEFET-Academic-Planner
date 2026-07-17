import type { ChType } from "@/lib/integralizacao/ch-catalog";
import { isManualChType } from "@/lib/integralizacao/ch-catalog";
import { resolveSyncedConcluidoHours } from "@/lib/integralizacao/resolve-synced-ch";
import type { IntegralizacaoRow } from "@/lib/types/db";

/**
 * Combina SIGAA, histórico local e lançamentos manuais permitidos.
 * `fromHistoricoPdf` vem do resumo `sigaa.ch.*` já resolvido pelo backend
 * (SQLite ou Postgres) — não lê configuração aqui para evitar acoplamento
 * ao SQLite no deploy cloud.
 */
export function resolveCategoryDoneHours(
  tipoCh: ChType,
  typeRows: IntegralizacaoRow[],
  computedFromDisciplinas: number,
  catalogTotal: number,
  fromHistoricoPdf: boolean
): number {
  const syncedRow = typeRows.find((row) => row.manual === 0);
  const syncedDone = resolveSyncedConcluidoHours(syncedRow, catalogTotal);

  if (
    !isManualChType(tipoCh) &&
    syncedDone !== null &&
    (fromHistoricoPdf ||
      (syncedRow != null &&
        syncedRow.pendente !== null &&
        syncedRow.pendente >= 0))
  ) {
    return syncedDone;
  }

  const baseDone = Math.max(syncedDone ?? 0, computedFromDisciplinas);

  if (!isManualChType(tipoCh)) {
    return baseDone;
  }

  const manualSum = typeRows
    .filter((row) => row.manual === 1)
    .reduce((sum, row) => sum + (row.concluido ?? 0), 0);

  return baseDone + manualSum;
}
