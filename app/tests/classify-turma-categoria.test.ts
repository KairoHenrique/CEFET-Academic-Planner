import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyTurmaCategoria } from "../src/lib/turmas-ofertadas/classify-turma-categoria";
import type { DisciplinaRow } from "../src/lib/types/db";

const obrigatoria: DisciplinaRow = {
  codigo: "02/3",
  nome: "Algoritmos e Estruturas de Dados II",
  tipo: "Obrigatória",
  carga_horaria: 60,
  periodo: 4,
  ementa: null,
};

const optativa: DisciplinaRow = {
  codigo: "08/1",
  nome: "Ciência de Dados",
  tipo: "Optativa",
  carga_horaria: 60,
  periodo: 8,
  ementa: null,
};

describe("classify-turma-categoria", () => {
  test("obrigatória do mapa → curso", () => {
    assert.equal(classifyTurmaCategoria(obrigatoria), "curso");
  });

  test("optativa do mapa → optativa", () => {
    assert.equal(classifyTurmaCategoria(optativa), "optativa");
  });

  test("sem match no mapa → optativa", () => {
    assert.equal(classifyTurmaCategoria(undefined), "optativa");
  });
});
