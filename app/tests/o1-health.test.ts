import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runHealthCheck,
  verifyCronSecret,
} from "../src/lib/health/check-health";

describe("O1 — health check", () => {
  it("shallow check responde ok sem tocar no banco", async () => {
    const result = await runHealthCheck(false);
    assert.equal(result.ok, true);
    assert.equal(result.service, "acme-hub");
    assert.equal(result.database, undefined);
  });

  it("deep em sqlite marca database skipped", async () => {
    const prevDb = process.env.PLANNER_DATABASE;
    const prevUrl = process.env.DATABASE_URL;
    delete process.env.PLANNER_DATABASE;
    delete process.env.DATABASE_URL;

    const result = await runHealthCheck(true);
    assert.equal(result.ok, true);
    assert.equal(result.backend, "sqlite");
    assert.equal(result.database, "skipped");

    process.env.PLANNER_DATABASE = prevDb;
    process.env.DATABASE_URL = prevUrl;
  });

  it("deep postgres usa query injetada", async () => {
    const prevDb = process.env.PLANNER_DATABASE;
    const prevUrl = process.env.DATABASE_URL;
    process.env.PLANNER_DATABASE = "postgres";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/postgres";

    let queried = false;
    const result = await runHealthCheck(true, {
      queryPostgres: async () => {
        queried = true;
      },
    });

    assert.equal(queried, true);
    assert.equal(result.ok, true);
    assert.equal(result.database, "ok");

    process.env.PLANNER_DATABASE = prevDb;
    process.env.DATABASE_URL = prevUrl;
  });

  it("verifyCronSecret exige bearer quando CRON_SECRET definido", () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-secret";

    assert.equal(
      verifyCronSecret(
        new Request("http://localhost/api/health?deep=1", {
          headers: { authorization: "Bearer test-secret" },
        })
      ),
      true
    );
    assert.equal(
      verifyCronSecret(new Request("http://localhost/api/health?deep=1")),
      false
    );

    process.env.CRON_SECRET = prev;
  });
});
