import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { buildCoRequisitoMap } from "../src/lib/mapa/course-status";

/** Pares mútuos teoria↔lab (e cluster OFT) conforme grade curricular PPC Eng. Computação. */
const PPC_MUTUAL_COREQUISITE_PAIRS: Array<[string, string]> = [
  ["08/3", "10/3"],
  ["15/3", "11/3"],
  ["01/5", "02/5"],
  ["05/1", "05/2"],
  ["05/2", "02/2"],
  ["01/3", "09/3"],
  ["01/4", "02/4"],
  ["01/2", "03/2"],
  ["04/4", "05/4"],
  ["05/5", "06/5"],
  ["07/5", "08/5"],
  ["07/4", "11/4"],
  ["09/5", "10/5"],
];

function loadPpcJsonItems() {
  const dataPath = path.join(
    process.cwd(),
    "src",
    "config",
    "mock",
    "disciplinas_db.json"
  );
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw) as Array<{
    disciplina: { codigo: string; carga_horaria: number };
    requisitos: Array<{
      disciplina_id: string;
      requisito_id: string;
      tipo: "pre" | "co";
    }>;
  }>;
}

function loadRequisitosFromPpcJson() {
  return loadPpcJsonItems().flatMap((item) => item.requisitos);
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

describe("ppc-corequisito-audit", () => {
  test("Cálculo I usa CH horas do PPC (90h), não hora-aula (75 h/a)", () => {
    const calculo = loadPpcJsonItems().find(
      (item) => item.disciplina.codigo === "01/1"
    );
    assert.ok(calculo);
    assert.equal(calculo!.disciplina.carga_horaria, 90);
  });

  test("todas as disciplinas PPC usam CH canônica (30/60/90/120)", () => {
    const allowed = new Set([30, 60, 90, 120]);
    for (const item of loadPpcJsonItems()) {
      assert.ok(
        allowed.has(item.disciplina.carga_horaria),
        `${item.disciplina.codigo} com CH ${item.disciplina.carga_horaria}`
      );
    }
  });

  test("JSON contém exatamente os corequisitos mútuos do grafo PPC", () => {
    const coMap = buildCoRequisitoMap(loadRequisitosFromPpcJson());
    const expected = new Set<string>();

    for (const [a, b] of PPC_MUTUAL_COREQUISITE_PAIRS) {
      expected.add(pairKey(a, b));
    }

    const actualPairs = new Set<string>();

    for (const [disciplinaId, codes] of coMap.entries()) {
      for (const coCode of codes) {
        actualPairs.add(pairKey(disciplinaId, coCode));
      }
    }

    assert.deepEqual(
      [...actualPairs].sort(),
      [...expected].sort(),
      "Corequisitos no disciplinas_db.json divergem do grafo PPC"
    );
  });

  test("cada par PPC é mútuo nos dois sentidos", () => {
    const coMap = buildCoRequisitoMap(loadRequisitosFromPpcJson());

    for (const [a, b] of PPC_MUTUAL_COREQUISITE_PAIRS) {
      assert.ok(
        coMap.get(a)?.includes(b),
        `Falta corequisito ${a} → ${b}`
      );
      assert.ok(
        coMap.get(b)?.includes(a),
        `Falta corequisito ${b} → ${a}`
      );
    }
  });
});
