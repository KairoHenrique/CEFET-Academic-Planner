import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { computeAbsenceRisk } from "../src/lib/disciplinas/absence-risk";
import { computeGradeRisk } from "../src/lib/disciplinas/grade-risk";

describe("computeAbsenceRisk", () => {
  test("reprova só acima do limite permitido", () => {
    assert.equal(computeAbsenceRisk(3, 3).label, "Crítico");
    assert.equal(computeAbsenceRisk(4, 3).label, "Reprovado por falta");
  });
});

describe("computeGradeRisk — faltas", () => {
  test("reprova por falta só acima do limite permitido", () => {
    const atLimit = computeGradeRisk({
      evaluations: [],
      grade: null,
      absences: 3,
      maxAbsences: 3,
    });
    const overLimit = computeGradeRisk({
      evaluations: [],
      grade: null,
      absences: 4,
      maxAbsences: 3,
    });

    assert.notEqual(atLimit.label, "Reprovado por falta");
    assert.equal(overLimit.label, "Reprovado por falta");
    assert.equal(overLimit.canStillPass, false);
  });
});
