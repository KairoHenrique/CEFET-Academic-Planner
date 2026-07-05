import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { assertSqliteAllowed } from "@/lib/db/backend/sqlite-guard";

type SqliteDatabase = BetterSqlite3.Database;

const userContext = new AsyncLocalStorage<string | undefined>();

const connections = new Map<string, SqliteDatabase>();
const bootstrappedPaths = new Set<string>();

function resolveDataRoot(): string {
  return process.env.PLANNER_DATA_ROOT || path.join(process.cwd(), ".data");
}

/** CPF/login SIGAA — só dígitos para pasta estável. */
export function normalizeSigaaUsername(username: string): string {
  const digits = username.trim().replace(/\D/g, "");
  return digits || username.trim();
}

export function resolveDbPathForUser(username?: string | null): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  if (!username?.trim()) {
    return path.join(resolveDataRoot(), "planner.db");
  }

  return path.join(
    resolveDataRoot(),
    "users",
    normalizeSigaaUsername(username),
    "planner.db"
  );
}

export function resolveUserDataDir(username?: string | null): string {
  if (process.env.DB_PATH) {
    return path.dirname(process.env.DB_PATH);
  }

  if (!username?.trim()) {
    return resolveDataRoot();
  }

  return path.join(resolveDataRoot(), "users", normalizeSigaaUsername(username));
}

export function runWithUserDb<T>(
  username: string | undefined | null,
  operation: () => T
): T {
  const normalized = username?.trim() || undefined;
  return userContext.run(normalized, operation);
}

export function getActiveSigaaUsername(): string | undefined {
  return userContext.getStore();
}

export function getActiveDatabase(): SqliteDatabase {
  assertSqliteAllowed("planner.db");
  const dbPath = resolveDbPathForUser(getActiveSigaaUsername());
  let connection = connections.get(dbPath);

  if (!connection) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    connection = new BetterSqlite3(dbPath);
    connection.pragma("journal_mode = WAL");
    connections.set(dbPath, connection);
  }

  return connection;
}

export function isDatabaseBootstrapped(dbPath: string): boolean {
  return bootstrappedPaths.has(dbPath);
}

export function markDatabaseBootstrapped(dbPath: string): void {
  bootstrappedPaths.add(dbPath);
}

export function resetConnectionsForTests(): void {
  for (const connection of connections.values()) {
    try {
      connection.close();
    } catch {
      // ignore
    }
  }
  connections.clear();
  bootstrappedPaths.clear();
}
