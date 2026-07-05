/**
 * Substituto de `better-sqlite3` no bundle OpenNext/Cloudflare.
 * Com `PLANNER_CLOUD=true`, rotas SQLite falham antes via `assertSqliteAllowed()`.
 */
class BetterSqlite3Stub {
  constructor(_filename?: string, _options?: unknown) {
    throw new Error(
      "better-sqlite3 indisponível no deploy cloud (use Postgres + PLANNER_CLOUD)."
    );
  }
}

export default BetterSqlite3Stub;
