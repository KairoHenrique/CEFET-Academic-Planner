import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  subscriptionRequiredError,
  unauthorizedError,
} from "../src/lib/api/errors";
import { shouldEnforceAccessGate } from "../src/lib/auth/access/access-gate";
import { isAppAccessAllowed } from "../src/lib/auth/access/access-status";

describe("B59 — gate de acesso", () => {
  it("libera trial_active e active", () => {
    assert.equal(isAppAccessAllowed("trial_active"), true);
    assert.equal(isAppAccessAllowed("active"), true);
  });

  it("bloqueia estados expirados ou pendentes", () => {
    for (const status of [
      "trial_expired",
      "pending_payment",
      "expired",
      "cancelled",
    ] as const) {
      assert.equal(isAppAccessAllowed(status), false);
    }
  });

  it("shouldEnforceAccessGate isenta auth, health e perfil", () => {
    assert.equal(
      shouldEnforceAccessGate(new Request("https://x/api/auth/login")),
      false
    );
    assert.equal(
      shouldEnforceAccessGate(new Request("https://x/api/health")),
      false
    );
    assert.equal(
      shouldEnforceAccessGate(new Request("https://x/api/perfil")),
      false
    );
    assert.equal(
      shouldEnforceAccessGate(new Request("https://x/api/mapa")),
      true
    );
  });

  it("subscriptionRequiredError retorna 403 com codigo dedicado", () => {
    const error = subscriptionRequiredError("Expirou", {
      renewHref: "/planos",
    });
    assert.equal(error.code, "SUBSCRIPTION_REQUIRED");
    assert.equal(error.status, 403);
    assert.deepEqual(error.details, { renewHref: "/planos" });
  });

  it("unauthorizedError retorna 401", () => {
    const error = unauthorizedError();
    assert.equal(error.code, "UNAUTHORIZED");
    assert.equal(error.status, 401);
  });
});
