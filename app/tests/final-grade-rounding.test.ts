import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { roundFinalGradeTotal } from "../src/lib/disciplinas/grade-rounding";

describe("roundFinalGradeTotal", () => {
  test("decimal >= 0,5 sobe para o inteiro", () => {
    assert.equal(roundFinalGradeTotal(31.6), 32);
    assert.equal(roundFinalGradeTotal(31.5), 32);
    assert.equal(roundFinalGradeTotal(59.9), 60);
  });

  test("decimal < 0,5 mantém uma casa decimal", () => {
    assert.equal(roundFinalGradeTotal(31.4), 31.4);
    assert.equal(roundFinalGradeTotal(31.49), 31.5);
    assert.equal(roundFinalGradeTotal(31.0), 31);
  });

  test("inteiro permanece inteiro", () => {
    assert.equal(roundFinalGradeTotal(60), 60);
    assert.equal(roundFinalGradeTotal(32), 32);
  });
});
