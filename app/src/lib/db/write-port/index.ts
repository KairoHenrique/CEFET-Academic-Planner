import { resolvePlannerDatabaseBackend } from "@/lib/db/backend/config";
import { sqliteWritePort } from "./sqlite-write-port";
import type { PlannerWritePort } from "./types";

export type {
  PlannerWritePort,
  TurmasOfertadasWriter,
} from "./types";

/**
 * Resolve o adapter de escrita conforme o backend ativo (`PLANNER_DATABASE`).
 *
 * - `sqlite`  → adapter local (dev / testes).
 * - `postgres`→ adapter Supabase (**B72b** — ainda não implementado).
 *
 * O acesso ao SQLite só ocorre quando um método é chamado (proxy em
 * `db/index.ts`), então importar este módulo em modo cloud é seguro.
 */
export function resolvePlannerWritePort(): PlannerWritePort {
  const backend = resolvePlannerDatabaseBackend();

  if (backend === "postgres") {
    throw new Error(
      "Write port Postgres ainda não implementado (B72b). " +
        "Sync real de escrita no Supabase pendente — ver docs/TASKS.md #12 Bloco 2f."
    );
  }

  return sqliteWritePort;
}
