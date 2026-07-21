import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCloudDeployment,
  isPostgresBackend,
  resolvePlannerDatabaseBackend,
} from "../src/lib/db/backend/config";
import {
  assertSqliteAllowed,
  isSqliteAllowed,
} from "../src/lib/db/backend/sqlite-guard";
import { ApiError } from "../src/lib/api/errors";

function withEnv(
  values: Record<string, string | undefined>,
  run: () => void
): void {
  const previous = new Map<string, string | undefined>();
  for (const key of Object.keys(values)) {
    previous.set(key, process.env[key]);
    const value = values[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("O2 — prod sem SQLite local", () => {
  it("PLANNER_CLOUD=true detecta deploy cloud", () => {
    withEnv({ PLANNER_CLOUD: "true" }, () => {
      assert.equal(isCloudDeployment(), true);
    });
  });

  it("cloud força backend postgres", () => {
    withEnv(
      {
        PLANNER_CLOUD: "true",
        PLANNER_DATABASE: undefined,
        DATABASE_URL: undefined,
      },
      () => {
        assert.equal(resolvePlannerDatabaseBackend(), "postgres");
        assert.equal(isPostgresBackend(), true);
        assert.equal(isSqliteAllowed(), false);
      }
    );
  });

  it("assertSqliteAllowed lança SQLITE_DISABLED no modo postgres", () => {
    withEnv(
      {
        PLANNER_DATABASE: "postgres",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/postgres",
        PLANNER_CLOUD: undefined,
      },
      () => {
        assert.throws(() => assertSqliteAllowed("teste"), (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.code, "SQLITE_DISABLED");
          assert.equal(error.status, 503);
          return true;
        });
      }
    );
  });

  it("sqlite permitido em dev local sem cloud/postgres", () => {
    withEnv(
      {
        PLANNER_CLOUD: "false",
        PLANNER_DATABASE: undefined,
        DATABASE_URL: undefined,
      },
      () => {
        assert.equal(isSqliteAllowed(), true);
        assert.doesNotThrow(() => assertSqliteAllowed());
      }
    );
  });
});
