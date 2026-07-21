import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260704150000_b62_account_email_queue.sql"
);

describe("B62 — account_email_queue migration", () => {
  it("declara fila com kinds de promoção e ciclo de conta", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS account_email_queue/);
    assert.match(sql, /'promotion'/);
    assert.match(sql, /'welcome'/);
    assert.match(sql, /'trial_ended'/);
    assert.match(sql, /'plan_expiring_soon'/);
    assert.match(sql, /'plan_ended'/);
    assert.match(sql, /idx_account_email_queue_dedupe/);
  });
});
