import { unauthorizedError, validationError } from "@/lib/api/errors";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";
import { assertSyncIngestRateLimit } from "@/lib/sync-ingest/ingest-rate-limit";
import { mirrorPortalLiteUserTables } from "@/lib/sync-ingest/mirror-portal-lite";

export interface IngestUserSnapshotResult {
  ok: true;
  source: "device";
  userId: string;
  rows: {
    semestreAtual: number;
    notas: number;
    faltas: number;
    tarefas: number;
  };
}

/**
 * Persiste snapshot R1 lite (portal) no Postgres sem apagar
 * histórico/notas/faltas/grupo (camadas ainda não raspadas no aparelho).
 */
export async function ingestUserSnapshotForProfile(
  profile: AppProfileRecord,
  snapshot: UserSqliteSnapshot
): Promise<IngestUserSnapshotResult> {
  if (!isPostgresBackend()) {
    throw validationError(
      "Ingest de sync no aparelho só está disponível no backend Postgres."
    );
  }

  if (!profile.userId || !profile.cpf) {
    throw unauthorizedError("Sessão inválida para ingest.");
  }

  assertSyncIngestRateLimit(profile.userId);

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await mirrorPortalLiteUserTables(
      client,
      { userId: profile.userId, cursoId: profile.cursoId || "eng-computacao" },
      snapshot
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  console.info(
    `[ingest] Snapshot device → Postgres ok (user ${profile.userId.slice(0, 8)}…).`
  );

  return {
    ok: true,
    source: "device",
    userId: profile.userId,
    rows: {
      semestreAtual: snapshot.semestreAtual.length,
      notas: snapshot.notasSynced.length,
      faltas: snapshot.faltasSynced.length,
      tarefas: snapshot.tarefasSynced.length,
    },
  };
}
