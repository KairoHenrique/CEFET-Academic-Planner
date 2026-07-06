import { AsyncLocalStorage } from "node:async_hooks";
import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment, isPostgresBackend } from "@/lib/db/backend/config";

const scraperSqliteOverride = new AsyncLocalStorage<boolean>();

/**
 * Permite o staging SQLite do scraper dentro de um processo em modo
 * Postgres (B72d) — dev local ou worker Node. Nunca vale no deploy
 * Cloudflare (sem filesystem): `isCloudDeployment()` tem precedência.
 */
export function runWithScraperSqlite<T>(operation: () => T): T {
  if (isCloudDeployment()) {
    return operation();
  }
  return scraperSqliteOverride.run(true, operation);
}

export function isSqliteAllowed(): boolean {
  if (isCloudDeployment()) {
    return false;
  }
  if (scraperSqliteOverride.getStore() === true) {
    return true;
  }
  return !isPostgresBackend();
}

export function assertSqliteAllowed(context?: string): void {
  if (isSqliteAllowed()) {
    return;
  }

  const suffix = context ? ` (${context})` : "";
  throw new ApiError(
    "SQLITE_DISABLED",
    `SQLite local indisponível no modo cloud/postgres${suffix}.`,
    503,
    {
      backend: isPostgresBackend() ? "postgres" : "cloud",
    }
  );
}
