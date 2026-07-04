import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CEFET_CH_TIERS,
  normalizeCefetCh,
  VALID_CEFET_CH,
} from "../src/lib/disciplinas/cefet-ch";

describe("cefet-ch", () => {
  test("CH canônica é apenas 30, 60, 90 ou 120", () => {
    assert.deepEqual([...VALID_CEFET_CH], [30, 60, 90, 120]);
    assert.deepEqual(
      CEFET_CH_TIERS.map((tier) => tier.ch),
      [30, 60, 90, 120]
    );
  });

  test("hora-aula PPC mapeia para CH canônica", () => {
    assert.equal(normalizeCefetCh(25), 30);
    assert.equal(normalizeCefetCh(50), 60);
    assert.equal(normalizeCefetCh(75), 90);
    assert.equal(normalizeCefetCh(100), 120);
  });

  test("CH horas do PPC permanecem nos tiers válidos", () => {
    assert.equal(normalizeCefetCh(30), 30);
    assert.equal(normalizeCefetCh(60), 60);
    assert.equal(normalizeCefetCh(90), 90);
    assert.equal(normalizeCefetCh(120), 120);
  });

  test("PFC/estágio (15h ou 12,5 h/a) normaliza para 30", () => {
    assert.equal(normalizeCefetCh(15), 30);
    assert.equal(normalizeCefetCh(12.5), 30);
  });
});
