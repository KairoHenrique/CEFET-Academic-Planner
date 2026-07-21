/**
 * Status do mapa: concluída vence cursando (semestre/MATR residual).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { HistoricoRow } from "../src/lib/types/db";
import {
  buildActiveCurrentDisciplinaSet,
  buildCompletedDisciplinaSet,
  buildCursandoDisciplinaSet,
  mergeCompletedWithClosedSemesterGrades,
  resolveCourseMapStatusResult,
} from "../src/lib/mapa/course-status";

function hist(
  disciplina_id: string,
  semestre: string,
  status: string,
  nota_final: number | null = null
): HistoricoRow {
  return { disciplina_id, semestre, status, nota_final };
}

describe("mapa course-status — concluída vs cursando", () => {
  test("aprovado vence cursando residual no histórico (MATR antigo)", () => {
    const historico = [
      hist("COMP001", "2025.1", "cursando"),
      hist("COMP001", "2025.2", "aprovado", 75),
    ];
    const completed = buildCompletedDisciplinaSet(historico);
    const cursando = buildCursandoDisciplinaSet(historico);
    assert.equal(completed.has("COMP001"), true);
    assert.equal(cursando.has("COMP001"), false);
  });

  test("resolveCourseMapStatusResult prioriza done sobre current", () => {
    const result = resolveCourseMapStatusResult({
      disciplina: {
        codigo: "COMP001",
        nome: "Teste",
        tipo: "Obrigatória",
        carga_horaria: 60,
        periodo: 1,
        ementa: null,
      },
      current: new Set(["COMP001"]),
      completed: new Set(["COMP001"]),
      preRequisitos: new Map(),
      obrigatoriaDone: 60,
      obrigatoriaTotal: 2000,
      allDisciplinas: [],
    });
    assert.equal(result.status, "done");
  });

  test("última tentativa MATR continua current", () => {
    const historico = [hist("COMP002", "2026.1", "cursando")];
    assert.equal(buildCursandoDisciplinaSet(historico).has("COMP002"), true);
    assert.equal(buildCompletedDisciplinaSet(historico).has("COMP002"), false);
  });

  test("portal vazio ignora MATR residual (férias / sociologia órfã)", () => {
    const historico = [hist("04/7", "2026.1", "cursando")];
    const current = buildActiveCurrentDisciplinaSet([], historico);
    assert.equal(current.has("04/7"), false);
    assert.equal(current.size, 0);
  });

  test("portal com turma ainda usa MATR + semestre como current", () => {
    const historico = [hist("04/7", "2026.1", "cursando")];
    const current = buildActiveCurrentDisciplinaSet(["04/7"], historico);
    assert.equal(current.has("04/7"), true);
  });

  test("MATR órfão com notas ≥ 60 vira concluída no mapa", () => {
    const historico = [hist("04/7", "2026.1", "cursando")];
    const completed = mergeCompletedWithClosedSemesterGrades({
      historico,
      semestreAtualCodes: [],
      gradeTotalsByCode: new Map([["04/7", 60]]),
    });
    assert.equal(completed.has("04/7"), true);
  });

  test("MATR ainda no semestre não vira concluída só pelas notas", () => {
    const historico = [hist("04/7", "2026.1", "cursando")];
    const completed = mergeCompletedWithClosedSemesterGrades({
      historico,
      semestreAtualCodes: ["04/7"],
      gradeTotalsByCode: new Map([["04/7", 85]]),
    });
    assert.equal(completed.has("04/7"), false);
  });
});
