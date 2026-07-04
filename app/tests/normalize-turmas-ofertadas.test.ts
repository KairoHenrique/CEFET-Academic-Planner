import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildTurmaSigaaId,
  dedupeTurmasOfertadasItems,
  normalizeTurmasOfertadasItems,
} from "../src/lib/turmas-ofertadas/normalize-turmas-ofertadas-items";
import type { TurmaOfertadaItem } from "../src/lib/scraper/types/turmas-ofertadas";

function sampleTurma(
  overrides: Partial<TurmaOfertadaItem> = {}
): TurmaOfertadaItem {
  return {
    turmaSigaaId: "pending",
    sigaaComponente: "G05CGRA0.02",
    codigoDisciplina: "05/4",
    nome: "COMPUTAÇÃO GRÁFICA",
    turmaCodigo: null,
    semestre: "2026.2",
    codigoHorario: "46M56",
    horarioExibicao: "46M56 (05/08/2026 - 07/12/2026)",
    local: null,
    professor: null,
    vagas: 30,
    vagasOcupadas: null,
    cargaHoraria: 60,
    situacao: "atendida",
    tipoTurma: "Turma Regular",
    departamento: "DECOMDV",
    horarioIndefinido: false,
    ...overrides,
  };
}

describe("normalize-turmas-ofertadas-items", () => {
  test("gera IDs distintos para o mesmo componente em horários diferentes", () => {
    const ids = normalizeTurmasOfertadasItems([
      sampleTurma({ codigoHorario: "46M56" }),
      sampleTurma({ codigoHorario: "46M34" }),
    ]).map((item) => item.turmaSigaaId);

    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    assert.match(ids[0] ?? "", /46M56$/);
    assert.match(ids[1] ?? "", /46M34$/);
  });

  test("remove linha repetida idêntica do SIGAA", () => {
    const deduped = dedupeTurmasOfertadasItems([
      sampleTurma(),
      sampleTurma(),
    ]);

    assert.equal(deduped.length, 1);
  });

  test("colapsa duplicata com sigaaComponente diferente e mesmo horário", () => {
    const deduped = dedupeTurmasOfertadasItems([
      sampleTurma({ sigaaComponente: "GDSACE01.01" }),
      sampleTurma({ sigaaComponente: "GDSACE01.02" }),
    ]);

    assert.equal(deduped.length, 1);
  });

  test("buildTurmaSigaaId inclui sufixo sem-horario quando necessário", () => {
    assert.equal(
      buildTurmaSigaaId("2026.2", "G05CGRA0.02", "pendente", null),
      "2026.2:G05CGRA0.02:pendente:sem-horario"
    );
  });
});
