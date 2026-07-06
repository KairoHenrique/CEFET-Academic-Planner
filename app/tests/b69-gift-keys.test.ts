import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { ApiError } from "../src/lib/api/errors";
import {
  generateGiftKeyCode,
  generateUniqueGiftKeyCodes,
} from "../src/lib/billing/gift-keys/generate-gift-key-code";
import {
  GIFT_KEY_CODE_PATTERN,
  normalizeGiftKeyCode,
} from "../src/lib/billing/gift-keys/gift-key-schema";
import { parseCreateGiftKeysRequest } from "../src/lib/billing/gift-keys/parse-create-gift-keys-request";
import { parseRedeemGiftKeyRequest } from "../src/lib/billing/gift-keys/parse-redeem-gift-key-request";
import {
  assertGiftKeyRedeemRateLimit,
  resetGiftKeyRedeemRateLimitForTests,
} from "../src/lib/billing/gift-keys/gift-key-redeem-rate-limit";

describe("B69 — generateGiftKeyCode", () => {
  it("gera 8 chars A-Z0-9", () => {
    const code = generateGiftKeyCode();
    assert.match(code, GIFT_KEY_CODE_PATTERN);
  });

  it("lote sem duplicatas", () => {
    const codes = generateUniqueGiftKeyCodes(20);
    assert.equal(codes.length, 20);
    assert.equal(new Set(codes).size, 20);
  });
});

describe("B69 — normalizeGiftKeyCode", () => {
  it("uppercase e remove separadores", () => {
    assert.equal(normalizeGiftKeyCode(" ab12-cd34 "), "AB12CD34");
  });
});

describe("B69 — parseRedeemGiftKeyRequest", () => {
  it("aceita code válido", () => {
    const parsed = parseRedeemGiftKeyRequest({ code: "AB12CD34" });
    assert.equal(parsed.code, "AB12CD34");
  });

  it("rejeita code curto", () => {
    assert.throws(
      () => parseRedeemGiftKeyRequest({ code: "ABC" }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });
});

describe("B69 — parseCreateGiftKeysRequest", () => {
  it("default count=1 e duration do plano", () => {
    const parsed = parseCreateGiftKeysRequest({ planId: "semester" });
    assert.equal(parsed.planId, "semester");
    assert.equal(parsed.count, 1);
    assert.equal(parsed.durationDays, 182);
  });

  it("limita count máximo 50", () => {
    assert.throws(
      () => parseCreateGiftKeysRequest({ planId: "month", count: 99 }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });
});

describe("B69 — rate limit resgate", () => {
  beforeEach(() => {
    resetGiftKeyRedeemRateLimitForTests();
    process.env.BILLING_REDEEM_MAX_ATTEMPTS = "3";
    process.env.BILLING_REDEEM_WINDOW_MS = "60000";
  });

  afterEach(() => {
    resetGiftKeyRedeemRateLimitForTests();
    delete process.env.BILLING_REDEEM_MAX_ATTEMPTS;
    delete process.env.BILLING_REDEEM_WINDOW_MS;
  });

  it("bloqueia após max tentativas", () => {
    const scope = "12345678901:127.0.0.1";
    assertGiftKeyRedeemRateLimit(scope);
    assertGiftKeyRedeemRateLimit(scope);
    assertGiftKeyRedeemRateLimit(scope);
    assert.throws(
      () => assertGiftKeyRedeemRateLimit(scope),
      (error: unknown) =>
        error instanceof ApiError && error.code === "RATE_LIMITED"
    );
  });
});

describe("B69 — migrations e rotas", () => {
  it("migration plan_gift_keys", () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        "../../supabase/migrations/20260705230000_b69_plan_gift_keys.sql"
      ),
      "utf8"
    );
    assert.match(sql, /CREATE TABLE IF NOT EXISTS plan_gift_keys/);
    assert.match(sql, /status IN \('available', 'redeemed', 'revoked', 'expired'\)/);
  });

  it("bootstrap inclui migrations B69", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/lib/db/bootstrap-postgres.ts"),
      "utf8"
    );
    assert.match(source, /20260705230000_b69_plan_gift_keys.sql/);
  });

  it("rotas redeem e dev gift-keys", () => {
    const redeem = readFileSync(
      resolve(__dirname, "../src/app/api/billing/redeem-key/route.ts"),
      "utf8"
    );
    assert.match(redeem, /redeemGiftKey/);

    const dev = readFileSync(
      resolve(__dirname, "../src/app/api/dev/gift-keys/route.ts"),
      "utf8"
    );
    assert.match(dev, /createGiftKeysBatch/);
    assert.match(dev, /listGiftKeys/);
  });
});
