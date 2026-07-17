import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDeliverablePromotionEmail } from "../src/lib/dev-panel/is-deliverable-promotion-email";

describe("isDeliverablePromotionEmail", () => {
  it("aceita Gmail real", () => {
    assert.equal(isDeliverablePromotionEmail("dev@example.com"), true);
    assert.equal(isDeliverablePromotionEmail("dev@example.com"), true);
  });

  it("rejeita smoke e example", () => {
    assert.equal(isDeliverablePromotionEmail("t2-A@smoke.test"), false);
    assert.equal(isDeliverablePromotionEmail("smoke-1930359260@example.com"), false);
    assert.equal(isDeliverablePromotionEmail("foo@example.org"), false);
    assert.equal(isDeliverablePromotionEmail("user@localhost"), false);
  });

  it("rejeita local-part de fixture em domínio real", () => {
    assert.equal(isDeliverablePromotionEmail("smoke-x@gmail.com"), false);
    assert.equal(isDeliverablePromotionEmail("t2-user@gmail.com"), false);
  });
});
