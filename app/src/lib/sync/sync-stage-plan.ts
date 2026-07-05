import { shouldRunHistoricoForMode, normalizeSyncMode } from "@/lib/sync-policy/resolve-sync-mode";
import type { SyncMode } from "@/lib/types/sync-pipeline";
import { getHistorico } from "@/lib/db/queries";
import { shouldRefreshHistoricoOnIncremental } from "@/lib/sync/sync-preferences";

function historicoLooksIncomplete(): boolean {
  const historico = getHistorico();
  if (historico.length === 0) return true;

  return !historico.some(
    (row) => row.status === "aprovado" || row.status === "cursando"
  );
}

export function shouldRunHistoricoStage(mode: SyncMode): boolean {
  const normalized = normalizeSyncMode(mode);
  if (shouldRunHistoricoForMode(normalized)) {
    if (normalized === "full") return true;
    if (historicoLooksIncomplete()) return true;
    return shouldRefreshHistoricoOnIncremental();
  }
  return false;
}
