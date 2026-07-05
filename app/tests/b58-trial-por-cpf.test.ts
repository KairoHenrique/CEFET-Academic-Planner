import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { TRIAL_DURATION_DAYS } from "../src/lib/auth/trial/constants";
import {
  buildTrialSubscriptionSnapshot,
  computeTrialExpiresAt,
} from "../src/lib/auth/trial/trial-status";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260704140000_b58_trial_por_cpf.sql"
);

describe("B58 — trial por CPF", () => {
  it("migration declara trial_por_cpf com PK em cpf", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS trial_por_cpf/);
    assert.match(sql, /cpf TEXT PRIMARY KEY/);
    assert.match(sql, /trial_started_at TIMESTAMPTZ NOT NULL/);
  });

  it("trial dura 7 dias a partir de trial_started_at", () => {
    const startedAt = new Date("2026-07-01T12:00:00.000Z");
    const expiresAt = computeTrialExpiresAt(startedAt);
    const diffDays =
      (expiresAt.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000);
    assert.equal(diffDays, TRIAL_DURATION_DAYS);
  });

  it("status trial_active enquanto dentro dos 7 dias", () => {
    const startedAt = new Date("2026-07-01T12:00:00.000Z");
    const now = new Date("2026-07-03T12:00:00.000Z");
    const snapshot = buildTrialSubscriptionSnapshot(startedAt, now);

    assert.equal(snapshot.status, "trial_active");
    assert.ok(snapshot.daysRemaining > 0);
    assert.equal(snapshot.planId, "trial");
  });

  it("status trial_expired após 7 dias", () => {
    const startedAt = new Date("2026-07-01T12:00:00.000Z");
    const now = new Date("2026-07-10T12:00:00.000Z");
    const snapshot = buildTrialSubscriptionSnapshot(startedAt, now);

    assert.equal(snapshot.status, "trial_expired");
    assert.equal(snapshot.daysRemaining, 0);
    assert.equal(snapshot.renewHref, "/planos");
  });
});
