import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { computeReferralGrantDays } from "../src/lib/billing/referrals/compute-referral-grant-days";
import {
  isValidFriendMatricula,
  normalizeFriendMatricula,
} from "../src/lib/billing/referrals/normalize-friend-matricula";
import {
  REFERRAL_BONUS_CAP_DAYS,
  REFERRAL_REWARD_DAYS,
} from "../src/lib/billing/referrals/referral-constants";

describe("B74 — normalizeFriendMatricula", () => {
  it("remove espaços", () => {
    assert.equal(normalizeFriendMatricula(" 2024 001234 "), "2024001234");
  });
});

describe("B74 — isValidFriendMatricula", () => {
  it("aceita matrícula numérica típica", () => {
    assert.equal(isValidFriendMatricula("2024001234"), true);
  });

  it("rejeita curta", () => {
    assert.equal(isValidFriendMatricula("123"), false);
  });
});

describe("B74 — computeReferralGrantDays", () => {
  it("concede 3 dias no primeiro bônus", () => {
    assert.equal(computeReferralGrantDays(0), REFERRAL_REWARD_DAYS);
  });

  it("respeita teto de 30 dias", () => {
    assert.equal(computeReferralGrantDays(REFERRAL_BONUS_CAP_DAYS), 0);
    assert.equal(computeReferralGrantDays(28), 2);
    assert.equal(computeReferralGrantDays(27), 3);
  });
});

describe("B74 — migration account_referrals", () => {
  it("cria tabela e source referral", () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        "../../supabase/migrations/20260717120000_b74_account_referrals.sql"
      ),
      "utf8"
    );
    assert.match(sql, /CREATE TABLE IF NOT EXISTS account_referrals/);
    assert.match(sql, /'referral'/);
  });

  it("bootstrap exige migrations B74", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/lib/db/bootstrap-postgres.ts"),
      "utf8"
    );
    assert.match(source, /20260717120000_b74_account_referrals\.sql/);
    assert.match(source, /20260717120100_b74_account_referrals_rls\.sql/);
  });
});
