import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { DEFAULT_BILLING_PRICES_CENTS } from "../src/lib/billing/default-plan-prices";
import { BILLING_PLAN_DEFINITIONS } from "../src/lib/billing/plan-catalog";
import {
  BILLING_GLOBAL_TABLES,
  BILLING_TENANT_TABLES,
  PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "../src/lib/billing/schema/billing-schema-catalog";

const MIGRATION_TABLES = resolve(
  __dirname,
  "../../supabase/migrations/20260705220000_b49_billing_tables.sql"
);

const MIGRATION_RLS = resolve(
  __dirname,
  "../../supabase/migrations/20260705220100_b49_billing_rls.sql"
);

describe("B49 — migration billing tables", () => {
  const sql = readFileSync(MIGRATION_TABLES, "utf8");

  it("cria plans, subscriptions e payments", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS plans/);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS subscriptions/);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS payments/);
  });

  it("plans referencia IDs do catálogo B47", () => {
    for (const plan of BILLING_PLAN_DEFINITIONS.filter((p) => p.kind === "paid")) {
      assert.match(sql, new RegExp(`'${plan.id}'`));
    }
  });

  it("seed de preços alinha com DEFAULT_BILLING_PRICES_CENTS", () => {
    for (const [planId, cents] of Object.entries(DEFAULT_BILLING_PRICES_CENTS)) {
      assert.match(sql, new RegExp(`'${planId}'[^;]*${cents}`));
    }
  });

  it("payments tem unicidade external_reference e idempotency_key", () => {
    assert.match(sql, /payments_external_reference_unique/);
    assert.match(sql, /payments_idempotency_key_unique/);
    assert.match(sql, /idx_payments_gateway_payment/);
  });

  it("subscriptions FK app_profiles e plans", () => {
    assert.match(sql, /REFERENCES app_profiles \(user_id\)/);
    assert.match(sql, /REFERENCES plans \(id\)/);
  });

  it("status enums alinhados ao SCOPE-CLOUD", () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      assert.match(sql, new RegExp(`'${status}'`));
    }
    for (const status of PAYMENT_STATUSES) {
      assert.match(sql, new RegExp(`'${status}'`));
    }
  });
});

describe("B49 — migration billing RLS", () => {
  const sql = readFileSync(MIGRATION_RLS, "utf8");

  it("plans global read · subscriptions/payments tenant", () => {
    assert.match(sql, /plans_select_authenticated/);
    assert.match(sql, /subscriptions_select_own/);
    assert.match(sql, /payments_select_own/);
    assert.match(sql, /user_id = auth\.uid\(\)/);
  });

  it("catálogo schema global vs tenant", () => {
    assert.deepEqual(BILLING_GLOBAL_TABLES, ["plans"]);
    assert.deepEqual(BILLING_TENANT_TABLES, ["subscriptions", "payments"]);
  });
});

describe("B49 — bootstrap postgres", () => {
  it("ensurePostgresReady inclui migrations B49", async () => {
    const source = readFileSync(
      resolve(__dirname, "../src/lib/db/bootstrap-postgres.ts"),
      "utf8"
    );
    assert.match(source, /20260705220000_b49_billing_tables.sql/);
    assert.match(source, /20260705220100_b49_billing_rls.sql/);
  });
});
