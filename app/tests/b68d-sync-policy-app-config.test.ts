import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  GLOBAL_DATA_TABLES,
  SYNC_POLICY_OVERRIDES_KEY,
  TENANT_DATA_TABLES,
} from "../src/lib/sync-policy/schema-catalog";
import { DEFAULT_SYNC_POLICY } from "../src/lib/sync-policy/defaults";
import {
  mergeSyncPolicyOverrides,
  parseSyncPolicyOverrides,
} from "../src/lib/sync-policy/merge-effective-policy";
import {
  readEffectiveSyncPolicySync,
  resetAppConfigStoreForTests,
  setSyncPolicyStoreModeForTests,
  writeSyncPolicyOverridesSync,
} from "../src/lib/sync-policy/app-config-store";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260705210000_b68d_sync_policy_app_config.sql"
);

describe("B68d — catálogo global vs tenant", () => {
  it("lista tabelas globais sem user_id e tenant com user_id", () => {
    const b39 = readFileSync(
      resolve(__dirname, "../../supabase/migrations/20260704120000_b39_initial_schema.sql"),
      "utf8"
    );

    for (const table of GLOBAL_DATA_TABLES) {
      assert.ok(b39.includes(`CREATE TABLE IF NOT EXISTS ${table}`));
      assert.ok(!TENANT_DATA_TABLES.includes(table as never));
    }

    for (const table of TENANT_DATA_TABLES) {
      const block = b39.match(
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?\\);`)
      )?.[0];
      assert.ok(block, `tabela tenant ausente: ${table}`);
      assert.match(block!, /\buser_id\b/);
    }
  });

  it("app_config é global (sem user_id no schema B39)", () => {
    const b39 = readFileSync(
      resolve(__dirname, "../../supabase/migrations/20260704120000_b39_initial_schema.sql"),
      "utf8"
    );
    const block = b39.match(
      /CREATE TABLE IF NOT EXISTS app_config[\s\S]*?\);/
    )?.[0];
    assert.ok(block);
    assert.doesNotMatch(block!, /\buser_id\b/);
  });
});

describe("B68d — migration app_config policy", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("seed sync.policy.overrides vazio", () => {
    assert.match(sql, new RegExp(SYNC_POLICY_OVERRIDES_KEY));
    assert.match(sql, /'\{\}'::jsonb/);
  });
});

describe("B68d — merge policy defaults + overrides", () => {
  it("retorna defaults §6.6 quando overrides vazio", () => {
    const policy = mergeSyncPolicyOverrides(null);
    assert.equal(policy.source, "defaults");
    assert.equal(policy.buttonScope, "lite");
    assert.equal(policy.autoIntervalHours, 3);
    assert.equal(policy.layers.notasTarefasHours, 6);
    assert.equal(policy.nightly.window, "03:00-06:00");
    assert.equal(policy.workerMaxConcurrent, 2);
  });

  it("merge parcial preserva defaults não alterados", () => {
    const policy = mergeSyncPolicyOverrides({
      buttonScope: "full",
      workerMaxConcurrent: 3,
      layers: { historicoDays: 14 },
    });
    assert.equal(policy.source, "merged");
    assert.equal(policy.buttonScope, "full");
    assert.equal(policy.workerMaxConcurrent, 3);
    assert.equal(policy.layers.historicoDays, 14);
    assert.equal(policy.layers.notasTarefasHours, 6);
  });

  it("parse rejeita JSON inválido", () => {
    assert.throws(() => parseSyncPolicyOverrides([]), /objeto JSON/);
  });
});

describe("B68d — app_config store (memory)", () => {
  it("lê e grava overrides via store sync", () => {
    resetAppConfigStoreForTests();
    setSyncPolicyStoreModeForTests("memory");

    const initial = readEffectiveSyncPolicySync();
    assert.equal(initial.buttonScope, DEFAULT_SYNC_POLICY.buttonScope);

    writeSyncPolicyOverridesSync({ buttonScope: "full" });
    const updated = readEffectiveSyncPolicySync();
    assert.equal(updated.buttonScope, "full");
    assert.equal(updated.layers.notasTarefasHours, 6);
  });
});
