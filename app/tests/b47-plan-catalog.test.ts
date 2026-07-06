import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { buildBillingPlansResponse } from "../src/lib/billing/build-plans-response";
import { computeBundleSavings } from "../src/lib/billing/compute-bundle-savings";
import { DEFAULT_BILLING_PRICES_CENTS } from "../src/lib/billing/default-plan-prices";
import {
  FIVE_YEAR_DURATION_DAYS,
  MONTH_DURATION_DAYS,
  QUARTER_DURATION_DAYS,
  SEMESTER_DURATION_DAYS,
  YEAR_DURATION_DAYS,
} from "../src/lib/billing/durations";
import { formatBrlCents } from "../src/lib/billing/format-brl-cents";
import {
  BILLING_PLAN_DEFINITIONS,
  resolvePlanDurationDays,
  resolvePlanLabel,
} from "../src/lib/billing/plan-catalog";
import { resolveBillingPriceCents } from "../src/lib/billing/resolve-plan-prices";
import { TRIAL_DURATION_DAYS } from "../src/lib/auth/trial/constants";

const ENV_BACKUP = { ...process.env };

function clearBillingPriceEnv(): void {
  delete process.env.BILLING_PRICE_MONTH_CENTS;
  delete process.env.BILLING_PRICE_QUARTER_CENTS;
  delete process.env.BILLING_PRICE_SEMESTER_CENTS;
  delete process.env.BILLING_PRICE_YEAR_CENTS;
  delete process.env.BILLING_PRICE_FIVE_YEAR_CENTS;
}

describe("B47 — catálogo canônico de planos", () => {
  it("define trial, mensal, trimestre, semestre, ano e 5 anos", () => {
    assert.equal(BILLING_PLAN_DEFINITIONS.length, 6);

    const month = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "month");
    assert.ok(month);
    assert.equal(month.durationDays, MONTH_DURATION_DAYS);
    assert.equal(month.purchasable, true);
  });

  it("resolvePlanLabel e resolvePlanDurationDays para IDs conhecidos", () => {
    assert.equal(resolvePlanLabel("month"), "Plano mensal");
    assert.equal(resolvePlanLabel("quarter"), "Plano trimestre");
    assert.equal(resolvePlanDurationDays("month"), MONTH_DURATION_DAYS);
  });
});

describe("B47 — preços base e override via env", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    clearBillingPriceEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("usa defaults R$ 30 / 50 / 85 / 150 / 700 sem env", () => {
    assert.equal(resolveBillingPriceCents("month"), 3000);
    assert.equal(resolveBillingPriceCents("quarter"), 5000);
    assert.equal(resolveBillingPriceCents("semester"), 8500);
    assert.equal(resolveBillingPriceCents("year"), 15000);
    assert.equal(resolveBillingPriceCents("five_year"), 70000);
    assert.deepEqual(DEFAULT_BILLING_PRICES_CENTS, {
      month: 3000,
      quarter: 5000,
      semester: 8500,
      year: 15000,
      five_year: 70000,
    });
  });
});

describe("B47 — economia entre pacotes", () => {
  it("trimestre economiza vs. 3 mensais (R$ 40)", () => {
    const savings = computeBundleSavings(3000, 3, 5000, "3 mensais");
    assert.ok(savings);
    assert.equal(savings?.percent, 44);
    assert.match(savings?.label ?? "", /40,00/);
  });

  it("semestre economiza vs. 2 trimestres (R$ 15)", () => {
    const savings = computeBundleSavings(5000, 2, 8500, "2 trimestres");
    assert.equal(savings?.percent, 15);
  });
});

describe("B47 — buildBillingPlansResponse", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    clearBillingPriceEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("expõe 5 planos pagos incluindo mensal R$ 30", () => {
    const response = buildBillingPlansResponse();
    const paid = response.plans.filter((p) => p.kind === "paid");
    assert.equal(paid.length, 5);

    const month = response.plans.find((p) => p.id === "month");
    assert.equal(month?.priceLabel, formatBrlCents(3000));
    assert.match(response.quarterSavings?.label ?? "", /40,00/);
  });
});

describe("B47 — API GET /api/billing/plans", () => {
  it("rota pública existe", () => {
    const routePath = resolve(
      __dirname,
      "../src/app/api/billing/plans/route.ts"
    );
    const source = readFileSync(routePath, "utf8");
    assert.match(source, /buildBillingPlansResponse/);
  });
});
