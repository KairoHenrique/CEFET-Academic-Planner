import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildElegibilidadeResponse } from "../src/lib/simulador/build-elegibilidade-response";
import { buildChoquesResponse } from "../src/lib/simulador/detect-grade-schedule-conflicts";
import { buildSimulationExport } from "../src/lib/simulador/build-simulation-export";
import {
  parseChoquesRequestBody,
  parseElegibilidadeCodesParam,
  parseSaveSimulationBody,
} from "../src/lib/simulador/parse-simulador-requests";
import type { TurmasCatalogSnapshot } from "../src/lib/simulador/load-turmas-catalog-snapshot";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> & Pick<TurmaOfertadaCourse, "turmaSigaaId" | "code">
): TurmaOfertadaCourse {
  return {
    name: overrides.code,
    status: "unlocked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    color: "#3FB950",
    room: "Sala 1",
    professor: "Prof.",
    ch: 60,
    turmaCodigo: "01",
    semestre: "2026.2",
    codigoHorario: "23456",
    vagas: 30,
    slots: [
      { day: 0, slot: 0 },
      { day: 2, slot: 0 },
    ],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: null,
    departamento: null,
    ...overrides,
  };
}

const catalog: TurmasCatalogSnapshot = {
  semestre: "2026.2",
  syncedAt: null,
  enrollmentContext: {
    completedDisciplinaCodes: [],
    coRequisitos: {},
    disciplinaNames: {},
  },
  courses: [
    sampleCourse({ turmaSigaaId: "t1", code: "AEDI", name: "Algoritmos I" }),
    sampleCourse({
      turmaSigaaId: "t2",
      code: "BD1",
      name: "Banco de Dados",
      status: "locked",
      slots: [{ day: 0, slot: 0 }],
    }),
    sampleCourse({
      turmaSigaaId: "t3",
      code: "SO",
      name: "Sistemas Operacionais",
      slots: [{ day: 0, slot: 1 }],
    }),
  ],
};

describe("B32 — motor elegibilidade", () => {
  it("lista elegibilidade por disciplina com canEnroll", () => {
    const response = buildElegibilidadeResponse(catalog);
    assert.equal(response.items.length, 3);
    const aedi = response.items.find((item) => item.code === "AEDI");
    const bd1 = response.items.find((item) => item.code === "BD1");
    assert.ok(aedi?.canEnroll);
    assert.equal(bd1?.canEnroll, false);
    assert.equal(bd1?.status, "locked");
  });

  it("filtra por codes na query", () => {
    const response = buildElegibilidadeResponse(catalog, ["AEDI"]);
    assert.equal(response.items.length, 1);
    assert.equal(response.items[0]?.code, "AEDI");
  });

  it("parseElegibilidadeCodesParam separa CSV", () => {
    const codes = parseElegibilidadeCodesParam("AEDI, bd1");
    assert.deepEqual(codes, ["AEDI", "bd1"]);
  });
});

describe("B33 — choque de horários", () => {
  it("detecta sobreposição na mesma célula", () => {
    const placements = catalog.courses.filter((course) =>
      ["t1", "t2"].includes(course.turmaSigaaId)
    );
    const response = buildChoquesResponse({
      semestre: catalog.semestre,
      placements,
      invalidTurmaIds: [],
    });
    assert.equal(response.hasConflicts, true);
    assert.equal(response.conflicts.length, 1);
    assert.equal(response.conflicts[0]?.codeA, "AEDI");
    assert.equal(response.conflicts[0]?.codeB, "BD1");
  });

  it("não reporta conflito em horários distintos", () => {
    const placements = catalog.courses.filter((course) =>
      ["t1", "t3"].includes(course.turmaSigaaId)
    );
    const response = buildChoquesResponse({
      semestre: catalog.semestre,
      placements,
      invalidTurmaIds: [],
    });
    assert.equal(response.hasConflicts, false);
  });

  it("parseChoquesRequestBody valida lista", () => {
    const body = parseChoquesRequestBody({
      turmaSigaaIds: ["t1", "t2"],
      candidateTurmaSigaaId: "t3",
    });
    assert.deepEqual(body.turmaSigaaIds, ["t1", "t2"]);
    assert.equal(body.candidateTurmaSigaaId, "t3");
  });
});

describe("B34 — export de simulação", () => {
  it("monta payload exportável com CH total", () => {
    const exportData = buildSimulationExport({
      titulo: "Grade A",
      semestre: "2026.2",
      courses: [catalog.courses[0]],
    });
    assert.equal(exportData.courses.length, 1);
    assert.equal(exportData.totalCh, 60);
    assert.equal(exportData.titulo, "Grade A");
  });

  it("parseSaveSimulationBody exige título e turmas", () => {
    const body = parseSaveSimulationBody({
      titulo: "Minha grade",
      turmaSigaaIds: ["t1"],
    });
    assert.equal(body.titulo, "Minha grade");
    assert.deepEqual(body.turmaSigaaIds, ["t1"]);
  });
});
