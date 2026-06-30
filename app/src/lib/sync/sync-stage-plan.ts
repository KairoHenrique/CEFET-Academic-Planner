import type { SyncMode } from "@/lib/types/sync-pipeline";
import { getHistorico } from "@/lib/db/queries";
import { shouldRefreshHistoricoOnIncremental } from "@/lib/sync/sync-preferences";

export function shouldRunHistoricoStage(mode: SyncMode): boolean {
  if (mode === "full") return true;
  if (getHistorico().length === 0) return true;
  return shouldRefreshHistoricoOnIncremental();
}
