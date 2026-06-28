import type { ChCatalogEntry } from "@/lib/integralizacao/ch-catalog";
import { resolveCategoryDoneHours } from "@/lib/integralizacao/resolve-category-done";
import type { IntegralizacaoRow } from "@/lib/types/db";
import type {
  IntegralizacaoCategoryDetail,
  IntegralizacaoManualEntry,
} from "@/lib/types/integralizacao-api";
import type { ChType } from "@/lib/integralizacao/ch-catalog";

function groupRowsByTipo(
  rows: IntegralizacaoRow[]
): Map<string, IntegralizacaoRow[]> {
  const grouped = new Map<string, IntegralizacaoRow[]>();

  for (const row of rows) {
    const bucket = grouped.get(row.tipo_ch) ?? [];
    bucket.push(row);
    grouped.set(row.tipo_ch, bucket);
  }

  return grouped;
}

function resolveTotalRequired(
  typeRows: IntegralizacaoRow[],
  catalogTotal: number
): number {
  const syncedRow = typeRows.find((row) => row.manual === 0);
  return syncedRow?.total_necessario ?? catalogTotal;
}

function mapManualEntries(typeRows: IntegralizacaoRow[]): IntegralizacaoManualEntry[] {
  return typeRows
    .filter((row) => row.manual === 1)
    .map((row) => ({
      id: row.id,
      tipoCh: row.tipo_ch as IntegralizacaoManualEntry["tipoCh"],
      horas: row.concluido ?? 0,
    }));
}

export function aggregateIntegralizacaoCategories(
  rows: IntegralizacaoRow[],
  catalog: readonly ChCatalogEntry[],
  computedByType: Partial<Record<ChType, number>> = {}
): IntegralizacaoCategoryDetail[] {
  const grouped = groupRowsByTipo(rows);

  return catalog.map((entry) => {
    const typeRows = grouped.get(entry.tipoCh) ?? [];
    const total = resolveTotalRequired(typeRows, entry.totalRequired);
    const done = resolveCategoryDoneHours(
      entry.tipoCh,
      typeRows,
      computedByType[entry.tipoCh] ?? 0
    );
    const pending = Math.max(0, total - done);

    return {
      label: entry.tipoCh,
      done,
      total,
      pending,
      color: entry.color,
      manualEntries: mapManualEntries(typeRows),
    };
  });
}
