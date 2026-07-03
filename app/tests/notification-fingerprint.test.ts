import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildGradeNotificationFingerprint,
  normalizeStoredBaselineFingerprint,
} from "../src/lib/notifications/notification-fingerprint";

describe("notification-fingerprint — notas", () => {
  test("fingerprint de nota é estável por disciplina e avaliação", () => {
    const first = buildGradeNotificationFingerprint("LAEDI", "PRO1", 7);
    const updated = buildGradeNotificationFingerprint("LAEDI", "PRO1", 8.5);

    assert.equal(first, "grade:laedi|pro1");
    assert.equal(updated, first);
  });

  test("migra baseline legada com nota embutida", () => {
    assert.equal(
      normalizeStoredBaselineFingerprint("grade:LAEDI|PRO1|7.5"),
      "grade:laedi|pro1"
    );
  });
});
