/**
 * Cada login SIGAA (CPF) usa um SQLite em `.data/users/{cpf}/`.
 * Não apagamos dados de outra conta ao sincronizar.
 */
export function ensureStudentSyncIsolation(_incomingMatricula: string): void {
  // Isolamento por arquivo — ver connection-manager / runWithUserDb.
}

export function resetLocalDatabaseForAccountSwitch(): void {
  // Mantido para compatibilidade; troca de conta = outro planner.db.
}
