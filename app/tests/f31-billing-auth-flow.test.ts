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
import { isSubscriptionAccessAllowed } from "../src/lib/billing/access/subscription-access-rules";

test("resolvePostAuthRedirect always goes home in free mode", () => {
  const expired = buildTrialSubscriptionSnapshot(
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  );
  const active = buildTrialSubscriptionSnapshot(new Date());

  assert.equal(resolvePostAuthRedirect(expired), "/");
  assert.equal(resolvePostAuthRedirect(active), "/");
});

test("subscription guard exempts billing routes", () => {
  assert.equal(isSubscriptionExemptPath("/planos"), true);
  assert.equal(isSubscriptionExemptPath("/planos/pix"), true);
  assert.equal(isSubscriptionExemptPath("/login"), true);
  assert.equal(isSubscriptionExemptPath("/"), false);
});

test("shouldGuardSubscriptionAccess never blocks in free mode", () => {
  assert.equal(
    shouldGuardSubscriptionAccess("trial_expired", "/disciplinas"),
    false
  );
  assert.equal(
    shouldGuardSubscriptionAccess("trial_expired", "/planos"),
    false
  );
  assert.equal(shouldGuardSubscriptionAccess("trial_active", "/"), false);
});

test("isSubscriptionAccessAllowed allows all statuses when billing off", () => {
  assert.equal(isSubscriptionAccessAllowed("trial_expired"), true);
  assert.equal(isSubscriptionAccessAllowed("expired"), true);
  assert.equal(isSubscriptionAccessAllowed("pending_payment"), true);
  assert.equal(isSubscriptionAccessAllowed("active"), true);
});

test("resolvePlanosFlowForStatus maps billing states (legado)", () => {
  assert.equal(resolvePlanosFlowForStatus("trial_expired"), "renew");
  assert.equal(resolvePlanosFlowForStatus("pending_payment"), "pending");
  assert.equal(resolvePlanosFlowForStatus("trial_active"), "welcome");
  assert.equal(resolvePlanosFlowForStatus("active"), null);
});

test("resolveSubscriptionGuardHref uses renew fallback (legado)", () => {
  assert.equal(
    resolveSubscriptionGuardHref("cancelled"),
    "/planos?flow=renew"
  );
});
