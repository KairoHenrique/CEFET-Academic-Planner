import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isNotificationMarkedReadInBaseline } from "../src/lib/notifications/notification-baseline";
import {
  buildGradeNotificationFingerprint,
  isGradeFingerprintMarkedReadInBaseline,
  normalizeStoredBaselineFingerprint,
} from "../src/lib/notifications/notification-fingerprint";

describe("notification-fingerprint — notas", () => {
  test("fingerprint inclui nota — mudança de valor gera nova chave", () => {
    const first = buildGradeNotificationFingerprint("02/3", "PRO1", 7);
    const updated = buildGradeNotificationFingerprint("02/3", "PRO1", 8.5);

    assert.equal(first, "grade:02/3|pro1|7");
    assert.equal(updated, "grade:02/3|pro1|8.5");
    assert.notEqual(updated, first);
  });

  test("migra baseline legada com nota embutida", () => {
    assert.equal(
      normalizeStoredBaselineFingerprint("grade:LAEDI|PRO1|7.5"),
      "grade:laedi|pro1|7.5"
    );
  });

  test("baseline legada sem nota cobre avaliação já vista", () => {
    const baseline = new Set(["grade:02/3|pro1"]);
    const current = buildGradeNotificationFingerprint("02/3", "PRO1", 9);

    assert.ok(isGradeFingerprintMarkedReadInBaseline(current, baseline));
    assert.ok(isNotificationMarkedReadInBaseline(current, baseline));
  });
});
