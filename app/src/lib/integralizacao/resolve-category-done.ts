import type { ChType } from "@/lib/integralizacao/ch-catalog";
import { isManualChType } from "@/lib/integralizacao/ch-catalog";
import type { IntegralizacaoRow } from "@/lib/types/db";

/** Combina SIGAA, histórico local e lançamentos manuais permitidos. */
export function resolveCategoryDoneHours(
  tipoCh: ChType,
  typeRows: IntegralizacaoRow[],
  computedFromDisciplinas: number
): number {
  const syncedRow = typeRows.find((row) => row.manual === 0);
  const syncedDone = syncedRow?.concluido ?? 0;
  const baseDone = Math.max(syncedDone, computedFromDisciplinas);

  if (!isManualChType(tipoCh)) {
    return baseDone;
  }

  const manualSum = typeRows
    .filter((row) => row.manual === 1)
    .reduce((sum, row) => sum + (row.concluido ?? 0), 0);

  return baseDone + manualSum;
}
