import { isSyncMirrorEnabled } from "./mirror-config";
import { mirrorSyncToPostgres } from "./mirror-to-postgres";

/**
 * Hook pós-sync: espelha o staging SQLite no Postgres quando habilitado.
 * Nunca lança — falha de replicação não pode derrubar um sync bem-sucedido;
 * o erro é logado (sem PII) e o próximo sync reespelha (idempotente).
 */
export async function runMirrorAfterSync(username: string): Promise<void> {
  if (!isSyncMirrorEnabled()) return;

  try {
    await mirrorSyncToPostgres(username);
  } catch (error) {
    console.error(
      "[mirror] Falha ao espelhar sync no Postgres:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
  }
}
