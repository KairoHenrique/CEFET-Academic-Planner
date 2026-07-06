import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { isSubscriptionAccessAllowed } from "../src/lib/billing/access/resolve-subscription-access";

describe("B52 — isSubscriptionAccessAllowed", () => {
  it("libera trial_active e active", () => {
    assert.equal(isSubscriptionAccessAllowed("trial_active"), true);
    assert.equal(isSubscriptionAccessAllowed("active"), true);
  });

  it("bloqueia trial_expired, pending_payment e expired", () => {
    assert.equal(isSubscriptionAccessAllowed("trial_expired"), false);
    assert.equal(isSubscriptionAccessAllowed("pending_payment"), false);
    assert.equal(isSubscriptionAccessAllowed("expired"), false);
    assert.equal(isSubscriptionAccessAllowed("cancelled"), false);
  });
});

describe("B52 — subscription access repository SQL", () => {
  const source = readFileSync(
    resolve(
      __dirname,
      "../src/lib/billing/access/subscription-access-repository.ts"
    ),
    "utf8"
  );

  it("consulta subscriptions via app_profiles.cpf", () => {
    assert.match(source, /INNER JOIN app_profiles p ON p\.user_id = s\.user_id/);
    assert.match(source, /WHERE p\.cpf = \$1/);
  });

  it("prioriza active válido e pending_payment", () => {
    assert.match(source, /s\.status = 'active'/);
    assert.match(source, /s\.status = 'pending_payment'/);
  });
});

describe("B52 — withDb usa enforceSubscriptionAccessGate", () => {
  it("integração gate billing-aware", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/lib/api/with-db.ts"),
      "utf8"
    );
    assert.match(source, /enforceSubscriptionAccessGate/);
  });
});

describe("B52 — mensagens por status bloqueado", () => {
  it("pending_payment tem mensagem PIX", () => {
    const source = readFileSync(
      resolve(
        __dirname,
        "../src/lib/billing/access/enforce-subscription-access-gate.ts"
      ),
      "utf8"
    );
    assert.match(source, /pending_payment/);
    assert.match(source, /subscriptionRequiredError/);
  });
});
