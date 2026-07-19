import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildGradeNotificationSubtitle } from "../src/lib/notifications/grade-notification-copy";

describe("grade-notification-copy", () => {
  test("inclui nota obtida e máxima", () => {
    assert.equal(
      buildGradeNotificationSubtitle("Engenharia de Software", 21, 30, "Prova 1"),
      "Engenharia de Software · Nota 21 / 30"
    );
  });

  test("formata decimais e omite máxima inválida", () => {
    assert.equal(
      buildGradeNotificationSubtitle("Estatística", 16.5, 20, "Trabalho"),
      "Estatística · Nota 16.5 / 20"
    );
    assert.equal(
      buildGradeNotificationSubtitle("Estatística", 16.5, null, "Trabalho"),
      "Estatística · Nota 16.5"
    );
  });
});
