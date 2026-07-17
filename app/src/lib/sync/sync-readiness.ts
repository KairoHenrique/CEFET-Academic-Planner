import { normalizeCpf } from "@/lib/auth/account/cpf";
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
  // O CPF do usuário e o `sync.username` gravado podem estar em formatos
  // diferentes (com/sem pontuação). Normalizamos para dígitos — a mesma regra
  // que resolve o DB por usuário (connection-manager) — para não forçar um
  // sync full de "primeiro acesso" em quem já sincronizou antes.
  const normalizedUsername = normalizeCpf(username);
  if (!normalizedUsername) {
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
  if (syncedUser && normalizeCpf(syncedUser) !== normalizedUsername) {
    return { canFastLogin: false, reason: "no_data" };
  }

  return { canFastLogin: true, reason: "ready" };
}
