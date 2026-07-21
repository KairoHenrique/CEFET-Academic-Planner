import test from "node:test";
import assert from "node:assert/strict";
import { resolvePostAuthRedirect } from "../src/lib/billing/post-auth-redirect";
import {
  isSubscriptionExemptPath,
  resolvePlanosFlowForStatus,
  resolveSubscriptionGuardHref,
  shouldGuardSubscriptionAccess,
} from "../src/lib/billing/subscription-access-client";
import { buildTrialSubscriptionSnapshot } from "../src/lib/auth/trial/trial-status";

test("resolvePostAuthRedirect sends expired trial to renew flow", () => {
  const expired = buildTrialSubscriptionSnapshot(
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  );

  assert.equal(resolvePostAuthRedirect(expired), "/planos?flow=renew");
});

test("resolvePostAuthRedirect sends active trial to welcome flow", () => {
  const active = buildTrialSubscriptionSnapshot(new Date());

  assert.equal(resolvePostAuthRedirect(active), "/planos?flow=welcome");
});

test("subscription guard exempts billing routes", () => {
  assert.equal(isSubscriptionExemptPath("/planos"), true);
  assert.equal(isSubscriptionExemptPath("/planos/pix"), true);
  assert.equal(isSubscriptionExemptPath("/login"), true);
  assert.equal(isSubscriptionExemptPath("/"), false);
});

test("shouldGuardSubscriptionAccess blocks expired trial outside planos", () => {
  assert.equal(
    shouldGuardSubscriptionAccess("trial_expired", "/disciplinas"),
    true
  );
  assert.equal(
    shouldGuardSubscriptionAccess("trial_expired", "/planos"),
    false
  );
  assert.equal(shouldGuardSubscriptionAccess("trial_active", "/"), false);
});

test("resolvePlanosFlowForStatus maps billing states", () => {
  assert.equal(resolvePlanosFlowForStatus("trial_expired"), "renew");
  assert.equal(resolvePlanosFlowForStatus("pending_payment"), "pending");
  assert.equal(resolvePlanosFlowForStatus("trial_active"), "welcome");
  assert.equal(resolvePlanosFlowForStatus("active"), null);
});

test("resolveSubscriptionGuardHref uses renew fallback", () => {
  assert.equal(
    resolveSubscriptionGuardHref("cancelled"),
    "/planos?flow=renew"
  );
});
