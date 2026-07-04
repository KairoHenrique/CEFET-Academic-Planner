import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  extractHorarioCodigoFromText,
  parseSigaaCodigoHorario,
} from "../src/lib/schedule/parse-sigaa-codigo";

describe("parse-sigaa-codigo — horários compactos CEFET", () => {
  test("extrai 46M56 de célula com período letivo", () => {
    const raw = "46M56 (05/08/2026 - 07/12/2026)";
    assert.equal(extractHorarioCodigoFromText(raw), "46M56");
  });

  test("expande 46M56 em Qui + Sex no mesmo bloco", () => {
    const positions = parseSigaaCodigoHorario("46M56");
    assert.equal(positions.length, 2);
    assert.deepEqual(
      positions.map((item) => `${item.dayIdx}:${item.slotIdx}`).sort(),
      ["2:2", "4:2"]
    );
  });

  test("mantém compatibilidade com 4M34 2T12", () => {
    const positions = parseSigaaCodigoHorario("4M34 2T12");
    assert.equal(positions.length, 2);
  });
});
