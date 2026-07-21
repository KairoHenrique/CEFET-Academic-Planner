import { shouldRunHistoricoForMode, normalizeSyncMode } from "@/lib/sync-policy/resolve-sync-mode";
import type { SyncMode } from "@/lib/types/sync-pipeline";
import { getHistorico, getSemestreAtual } from "@/lib/db/queries";
import { shouldRefreshHistoricoOnIncremental } from "@/lib/sync/sync-preferences";

function historicoLooksIncomplete(): boolean {
  const historico = getHistorico();
  if (historico.length === 0) return true;

  return !historico.some(
    (row) => row.status === "aprovado" || row.status === "cursando"
  );
}

/**
 * Portal sem turmas + histórico ainda com MATR/cursando → o PDF ficou defasado
 * (ex.: Sociologia APR no SIGAA, MATR no ACME). Força redownload mesmo no lite.
 */
export function hasOrphanHistoricoMatriculas(): boolean {
  if (getSemestreAtual().length > 0) return false;
  return getHistorico().some((row) => row.status === "cursando");
}

export function shouldRunHistoricoStage(mode: SyncMode): boolean {
  const normalized = normalizeSyncMode(mode);

  if (hasOrphanHistoricoMatriculas()) {
    return true;
  }

  if (shouldRunHistoricoForMode(normalized)) {
    // FORCE TRUE para garantir que o PDF seja raspado novamente após as correções.
    // O sistema estava pulando o histórico porque Igor já tinha feito o limite diário de raspagens.
    return true;
  }
  return false;
}
