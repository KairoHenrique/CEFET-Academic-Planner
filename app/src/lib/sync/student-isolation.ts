import {
  clearSyncedStudentData,
  getAluno,
} from "@/lib/db/queries";

/**
 * Troca de conta SIGAA no mesmo SQLite local: apaga dados do aluno anterior
 * antes de persistir o novo snapshot (evita LAOC/disciplinas fantasmas).
 */
export function ensureStudentSyncIsolation(incomingMatricula: string): void {
  const next = incomingMatricula.trim();
  if (!next) return;

  const previous = getAluno()?.matricula?.trim();
  if (!previous || previous === next) return;

  resetLocalDatabaseForAccountSwitch();
}

export function resetLocalDatabaseForAccountSwitch(): void {
  clearSyncedStudentData();
}
