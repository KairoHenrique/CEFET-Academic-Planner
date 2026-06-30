import type { ChCatalogEntry } from "@/lib/integralizacao/ch-catalog";
import { resolveCategoryDoneHours } from "@/lib/integralizacao/resolve-category-done";
import {
  resolveEffectiveTotalRequired,
  resolveSyncedPendenteHours,
} from "@/lib/integralizacao/resolve-synced-ch";
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

function resolveSyncedRow(
  typeRows: IntegralizacaoRow[]
): IntegralizacaoRow | undefined {
  return typeRows.find((row) => row.manual === 0);
}

function resolveTotalRequired(
  typeRows: IntegralizacaoRow[],
  catalogTotal: number
): number {
  const syncedRow = resolveSyncedRow(typeRows);
  return resolveEffectiveTotalRequired(syncedRow, catalogTotal);
}

function resolvePendingHours(
  typeRows: IntegralizacaoRow[],
  catalogTotal: number,
  done: number
): number {
  const syncedRow = resolveSyncedRow(typeRows);
  return resolveSyncedPendenteHours(syncedRow, catalogTotal, done) ?? Math.max(0, catalogTotal - done);
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
      computedByType[entry.tipoCh] ?? 0,
      entry.totalRequired
    );
    const pending = resolvePendingHours(typeRows, total, done);

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
