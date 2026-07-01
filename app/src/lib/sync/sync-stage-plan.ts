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
  if (mode === "full") return true;
  if (historicoLooksIncomplete()) return true;
  return shouldRefreshHistoricoOnIncremental();
}
