import { getAluno, getHistorico, getSemestreAtual, countDisciplinas } from "@/lib/db/queries";
import {
  getSyncLastAt,
  getSyncedUsername,
} from "@/lib/sync/sync-preferences";

export type SyncReadinessReason = "ready" | "no_data";

export interface SyncReadiness {
  canFastLogin: boolean;
  reason: SyncReadinessReason;
}

function hasSyncedAcademicData(): boolean {
  return getSemestreAtual().length > 0 || getHistorico().length > 0;
}

/**
 * Login rápido só se este CPF já concluiu ao menos um sync full com dados reais.
 */
export function evaluateSyncReadiness(username: string): SyncReadiness {
  const trimmed = username.trim();
  if (!trimmed) {
    return { canFastLogin: false, reason: "no_data" };
  }

  const aluno = getAluno();
  if (!aluno?.matricula?.trim()) {
    return { canFastLogin: false, reason: "no_data" };
  }

  if (!getSyncLastAt()) {
    return { canFastLogin: false, reason: "no_data" };
  }

  if (countDisciplinas() === 0) {
    return { canFastLogin: false, reason: "no_data" };
  }

  if (!hasSyncedAcademicData()) {
    return { canFastLogin: false, reason: "no_data" };
  }

  const syncedUser = getSyncedUsername();
  if (syncedUser && syncedUser !== trimmed) {
    return { canFastLogin: false, reason: "no_data" };
  }

  return { canFastLogin: true, reason: "ready" };
}
