import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { buildBillingPlansResponse } from "../src/lib/billing/build-plans-response";
import { computeBundleSavings } from "../src/lib/billing/compute-bundle-savings";
import { DEFAULT_BILLING_PRICES_CENTS } from "../src/lib/billing/default-plan-prices";
import {
  FIVE_YEAR_DURATION_DAYS,
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
  delete process.env.BILLING_PRICE_QUARTER_CENTS;
  delete process.env.BILLING_PRICE_SEMESTER_CENTS;
  delete process.env.BILLING_PRICE_YEAR_CENTS;
  delete process.env.BILLING_PRICE_FIVE_YEAR_CENTS;
}

describe("B47 — catálogo canônico de planos", () => {
  it("define trial, trimestre, semestre, ano e 5 anos", () => {
    assert.equal(BILLING_PLAN_DEFINITIONS.length, 5);

    const trial = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "trial");
    const quarter = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "quarter");
    const semester = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "semester");
    const year = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "year");
    const fiveYear = BILLING_PLAN_DEFINITIONS.find((p) => p.id === "five_year");

    assert.ok(trial);
    assert.ok(quarter);
    assert.ok(semester);
    assert.ok(year);
    assert.ok(fiveYear);

    assert.equal(trial.durationDays, TRIAL_DURATION_DAYS);
    assert.equal(trial.oncePerCpf, true);
    assert.equal(trial.purchasable, false);

    assert.equal(quarter.durationDays, QUARTER_DURATION_DAYS);
    assert.equal(quarter.purchasable, true);

    assert.equal(semester.durationDays, SEMESTER_DURATION_DAYS);
    assert.equal(semester.featured, true);
    assert.equal(semester.purchasable, true);

    assert.equal(year.durationDays, YEAR_DURATION_DAYS);
    assert.equal(year.purchasable, true);

    assert.equal(fiveYear.durationDays, FIVE_YEAR_DURATION_DAYS);
    assert.equal(fiveYear.purchasable, true);
  });

  it("resolvePlanLabel e resolvePlanDurationDays para IDs conhecidos", () => {
    assert.equal(resolvePlanLabel("trial"), "Trial 7 dias");
    assert.equal(resolvePlanLabel("quarter"), "Plano trimestre");
    assert.equal(resolvePlanLabel("semester"), "Plano semestre");
    assert.equal(resolvePlanLabel("year"), "Plano anual");
    assert.equal(resolvePlanLabel("five_year"), "Plano 5 anos");
    assert.equal(resolvePlanLabel("unknown"), "unknown");

    assert.equal(resolvePlanDurationDays("trial"), TRIAL_DURATION_DAYS);
    assert.equal(resolvePlanDurationDays("quarter"), QUARTER_DURATION_DAYS);
    assert.equal(resolvePlanDurationDays("semester"), SEMESTER_DURATION_DAYS);
    assert.equal(resolvePlanDurationDays("year"), YEAR_DURATION_DAYS);
    assert.equal(resolvePlanDurationDays("five_year"), FIVE_YEAR_DURATION_DAYS);
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

  it("usa defaults R$ 50 / R$ 85 / R$ 150 / R$ 700 sem env", () => {
    assert.equal(resolveBillingPriceCents("quarter"), 5000);
    assert.equal(resolveBillingPriceCents("semester"), 8500);
    assert.equal(resolveBillingPriceCents("year"), 15000);
    assert.equal(resolveBillingPriceCents("five_year"), 70000);
    assert.deepEqual(DEFAULT_BILLING_PRICES_CENTS, {
      quarter: 5000,
      semester: 8500,
      year: 15000,
      five_year: 70000,
    });
  });

  it("permite sobrescrever via env", () => {
    process.env.BILLING_PRICE_QUARTER_CENTS = "4500";
    process.env.BILLING_PRICE_SEMESTER_CENTS = "8000";
    process.env.BILLING_PRICE_YEAR_CENTS = "14000";

    assert.equal(resolveBillingPriceCents("quarter"), 4500);
    assert.equal(resolveBillingPriceCents("semester"), 8000);
    assert.equal(resolveBillingPriceCents("year"), 14000);
  });

  it("ignora valores inválidos no env e mantém default", () => {
    process.env.BILLING_PRICE_SEMESTER_CENTS = "abc";
    assert.equal(resolveBillingPriceCents("semester"), 8500);
  });
});

describe("B47 — economia entre pacotes", () => {
  it("semestre economiza vs. 2 trimestres (R$ 15)", () => {
    const savings = computeBundleSavings(5000, 2, 8500, "2 trimestres");
    assert.ok(savings);
    assert.equal(savings?.percent, 15);
    assert.match(savings?.label ?? "", /15,00/);
    assert.match(savings?.label ?? "", /2 trimestres/);
  });

  it("ano economiza vs. 2 semestres (R$ 20)", () => {
    const savings = computeBundleSavings(8500, 2, 15000, "2 semestres");
    assert.ok(savings);
    assert.equal(savings?.percent, 12);
    assert.match(savings?.label ?? "", /20,00/);
    assert.match(savings?.label ?? "", /2 semestres/);
  });

  it("5 anos economiza vs. 5 anuais (R$ 50)", () => {
    const savings = computeBundleSavings(15000, 5, 70000, "5 anuais");
    assert.ok(savings);
    assert.equal(savings?.percent, 7);
    assert.match(savings?.label ?? "", /50,00/);
    assert.match(savings?.label ?? "", /5 anuais/);
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

  it("expõe preços base e checkout desabilitado (pré-B50)", () => {
    const response = buildBillingPlansResponse();

    assert.equal(response.ok, true);
    assert.equal(response.currency, "BRL");
    assert.equal(response.checkoutEnabled, false);
    assert.equal(response.trialPolicy.durationDays, 7);
    assert.equal(response.trialPolicy.oncePerCpf, true);

    const paid = response.plans.filter((p) => p.kind === "paid");
    assert.equal(paid.length, 4);

    const quarter = response.plans.find((p) => p.id === "quarter");
    const semester = response.plans.find((p) => p.id === "semester");
    const year = response.plans.find((p) => p.id === "year");
    const fiveYear = response.plans.find((p) => p.id === "five_year");

    assert.equal(quarter?.priceLabel, formatBrlCents(5000));
    assert.equal(semester?.priceLabel, formatBrlCents(8500));
    assert.equal(year?.priceLabel, formatBrlCents(15000));
    assert.equal(fiveYear?.priceLabel, formatBrlCents(70000));

    assert.match(response.semesterSavings?.label ?? "", /15,00/);
    assert.match(response.yearSavings?.label ?? "", /20,00/);
    assert.match(response.fiveYearSavings?.label ?? "", /50,00/);
  });
});

describe("B47 — API GET /api/billing/plans", () => {
  it("rota pública existe e usa buildBillingPlansResponse", () => {
    const routePath = resolve(
      __dirname,
      "../src/app/api/billing/plans/route.ts"
    );
    const source = readFileSync(routePath, "utf8");

    assert.match(source, /export const GET/);
    assert.match(source, /buildBillingPlansResponse/);
    assert.match(source, /apiSuccess/);
  });
});
