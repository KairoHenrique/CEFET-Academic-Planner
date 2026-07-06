import { isSqliteAllowed } from "@/lib/db/backend/sqlite-guard";
import { sqliteWritePort } from "./sqlite-write-port";
import type { PlannerWritePort } from "./types";

export type {
  PlannerWritePort,
  TurmasOfertadasWriter,
} from "./types";

/**
 * Resolve o adapter de escrita do pipeline de sync (B72).
 *
 * Arquitetura B72b: o scraper SEMPRE grava no staging SQLite (regras de
 * negócio intactas) e o mirror pós-sync replica ao Postgres
 * (`lib/sync-mirror`). Em modo postgres local/worker, o staging é liberado
 * via `runWithScraperSqlite`. Só o deploy Cloudflare (sem fs) não escreve —
 * lá o sync é delegado ao worker externo (B72e).
 */
export function resolvePlannerWritePort(): PlannerWritePort {
  if (!isSqliteAllowed()) {
    throw new Error(
      "Escrita de sync indisponível no deploy cloud — o scraper roda no " +
        "worker externo com mirror Postgres (B72e). Ver docs/TASKS.md #12 Bloco 2f."
    );
  }

  return sqliteWritePort;
}
