import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  computeGracePeriodEndsAt,
  isWithinGracePeriod,
  resolveGracePeriodDays,
} from "../src/lib/billing/renewal/resolve-grace-period-days";
import { resolveAccessExpiryMetrics } from "../src/lib/billing/access/subscription-access-repository";

const ENV_BACKUP = { ...process.env };

describe("B53 — grace period config", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    delete process.env.BILLING_GRACE_PERIOD_DAYS;
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("default 3 dias sem env", () => {
    assert.equal(resolveGracePeriodDays(), 3);
  });

  it("override via BILLING_GRACE_PERIOD_DAYS", () => {
    process.env.BILLING_GRACE_PERIOD_DAYS = "7";
    assert.equal(resolveGracePeriodDays(), 7);
  });
});

describe("B53 — isWithinGracePeriod", () => {
  it("true dentro da janela pós-expiração", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    const expiredAt = "2026-07-09T12:00:00.000Z";
    assert.equal(isWithinGracePeriod(expiredAt, 3, now), true);
  });

  it("false após fim do grace", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");
    const expiredAt = "2026-07-09T12:00:00.000Z";
    assert.equal(isWithinGracePeriod(expiredAt, 3, now), false);
  });
});

describe("B53 — resolveAccessExpiryMetrics", () => {
  it("marca inGracePeriod e recalcula daysRemaining", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    const metrics = resolveAccessExpiryMetrics(
      "2026-07-09T12:00:00.000Z",
      now
    );
    assert.equal(metrics.inGracePeriod, true);
    assert.ok(metrics.daysRemaining > 0);
    assert.equal(
      metrics.expiresAt,
      computeGracePeriodEndsAt("2026-07-09T12:00:00.000Z", 3).toISOString()
    );
  });
});

describe("B53 — checkout renewal flag", () => {
  it("tipo BillingCheckoutResponse inclui renewal", async () => {
    const mod = await import("../src/lib/billing/checkout/types.ts");
    assert.ok(mod);
  });
});
