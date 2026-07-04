import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildFailedDisciplinaSet,
  normalizeDisciplinaCode,
} from "../src/lib/mapa/course-status";
import { applyCorequisitoOfferGate } from "../src/lib/turmas-ofertadas/apply-corequisito-offer-gate";
import { resolveEnrollmentEligibility } from "../src/lib/turmas-ofertadas/resolve-enrollment-eligibility";
import type { DisciplinaRow, HistoricoRow } from "../src/lib/types/db";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

const aes2: DisciplinaRow = {
  codigo: "02/3",
  nome: "ALGORITMOS E ESTRUTURAS DE DADOS II",
  tipo: "Obrigatória",
  carga_horaria: 60,
  periodo: 3,
  ementa: null,
};

const labEletronica: DisciplinaRow = {
  codigo: "11/4",
  nome: "LABORATÓRIO DE ELETRÔNICA",
  tipo: "Obrigatória",
  carga_horaria: 30,
  periodo: 4,
  ementa: null,
};

const eletronica: DisciplinaRow = {
  codigo: "10/4",
  nome: "ELETRÔNICA",
  tipo: "Obrigatória",
  carga_horaria: 60,
  periodo: 4,
  ementa: null,
};

const analiseCircuitos: DisciplinaRow = {
  codigo: "09/4",
  nome: "ANÁLISE DE CIRCUITOS ELÉTRICOS",
  tipo: "Obrigatória",
  carga_horaria: 60,
  periodo: 4,
  ementa: null,
};

const disciplinas = [aes2, labEletronica, eletronica, analiseCircuitos];

function baseContext(overrides: Partial<Parameters<typeof resolveEnrollmentEligibility>[2]> = {}) {
  return {
    completed: new Set<string>(),
    current: new Set<string>(),
    failed: new Set<string>(),
    preRequisitos: new Map<string, string[]>(),
    coRequisitos: new Map<string, string[]>(),
    disciplinas,
    obrigatoriaDone: 600,
    obrigatoriaTotal: 3105,
    ...overrides,
  };
}

function historicoRow(
  disciplinaId: string,
  semestre: string,
  status: string
): HistoricoRow {
  return {
    id: 1,
    disciplina_id: disciplinaId,
    semestre,
    status,
    nota_final: null,
  };
}

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> & Pick<TurmaOfertadaCourse, "code">
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: overrides.code,
    name: overrides.name ?? overrides.code,
    status: overrides.status ?? "unlocked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    color: "#3FB950",
    room: "201",
    professor: "Prof.",
    ch: 60,
    turmaCodigo: "01",
    semestre: "2026.2",
    codigoHorario: "24M12",
    vagas: 30,
    slots: [],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: null,
    departamento: null,
    ...overrides,
  };
}

describe("resolve-enrollment-eligibility", () => {
  test("libera turma quando pré-requisito já foi aprovado", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("02/3"), [normalizeDisciplinaCode("02/2")]],
    ]);
    const completed = new Set([normalizeDisciplinaCode("02/2")]);

    const result = resolveEnrollmentEligibility(aes2, "02/3", baseContext({
      completed,
      preRequisitos,
    }));

    assert.equal(result.eligibility, "ready");
  });

  test("marca condicional quando pré-requisito está em andamento", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("02/3"), [normalizeDisciplinaCode("02/2")]],
    ]);
    const current = new Set([normalizeDisciplinaCode("02/2")]);

    const result = resolveEnrollmentEligibility(aes2, "02/3", baseContext({
      current,
      preRequisitos,
    }));

    assert.equal(result.eligibility, "conditional");
    assert.deepEqual(result.pendingPrereqCodes, [normalizeDisciplinaCode("02/2")]);
  });

  test("oculta turma já matriculada no semestre atual", () => {
    const sociologia: DisciplinaRow = {
      codigo: "04/7",
      nome: "INTRODUÇÃO À SOCIOLOGIA",
      tipo: "Obrigatória",
      carga_horaria: 30,
      periodo: 2,
      ementa: null,
    };
    const current = new Set([normalizeDisciplinaCode("04/7")]);

    const result = resolveEnrollmentEligibility(
      sociologia,
      "04/7",
      baseContext({ current, disciplinas: [...disciplinas, sociologia] })
    );

    assert.equal(result.eligibility, "hidden");
  });

  test("oculta turma quando pré-requisito foi reprovado", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("02/3"), [normalizeDisciplinaCode("02/2")]],
    ]);
    const failed = new Set([normalizeDisciplinaCode("02/2")]);

    const result = resolveEnrollmentEligibility(aes2, "02/3", baseContext({
      failed,
      preRequisitos,
    }));

    assert.equal(result.eligibility, "hidden");
  });

  test("oculta turma quando pré-requisito nem foi iniciado", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("02/3"), [normalizeDisciplinaCode("02/2")]],
    ]);

    const result = resolveEnrollmentEligibility(aes2, "02/3", baseContext({
      preRequisitos,
    }));

    assert.equal(result.eligibility, "hidden");
  });

  test("oculta turma quando corequisito ainda não é matriculável", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("10/4"), [normalizeDisciplinaCode("05/2")]],
      [normalizeDisciplinaCode("09/4"), [normalizeDisciplinaCode("04/2")]],
    ]);
    const coRequisitos = new Map([
      [normalizeDisciplinaCode("09/4"), [normalizeDisciplinaCode("10/4")]],
      [normalizeDisciplinaCode("10/4"), [normalizeDisciplinaCode("09/4")]],
    ]);
    const completed = new Set([
      normalizeDisciplinaCode("04/2"),
    ]);

    const result = resolveEnrollmentEligibility(
      analiseCircuitos,
      "09/4",
      baseContext({
        completed,
        preRequisitos,
        coRequisitos,
      })
    );

    assert.equal(result.eligibility, "hidden");
  });

  test("libera turma quando corequisito também é matriculável", () => {
    const preRequisitos = new Map([
      [normalizeDisciplinaCode("10/4"), [normalizeDisciplinaCode("05/2")]],
      [normalizeDisciplinaCode("09/4"), [normalizeDisciplinaCode("04/2")]],
    ]);
    const coRequisitos = new Map([
      [normalizeDisciplinaCode("09/4"), [normalizeDisciplinaCode("10/4")]],
      [normalizeDisciplinaCode("10/4"), [normalizeDisciplinaCode("09/4")]],
    ]);
    const completed = new Set([
      normalizeDisciplinaCode("04/2"),
      normalizeDisciplinaCode("05/2"),
    ]);

    const result = resolveEnrollmentEligibility(
      analiseCircuitos,
      "09/4",
      baseContext({
        completed,
        preRequisitos,
        coRequisitos,
      })
    );

    assert.equal(result.eligibility, "ready");
  });
});

describe("applyCorequisitoOfferGate", () => {
  test("oculta turma quando parceiro de corequisito não está na oferta visível", () => {
    const courses = applyCorequisitoOfferGate([
      sampleCourse({
        code: "09/4",
        name: "ANÁLISE DE CIRCUITOS ELÉTRICOS",
        coRequisitoCodes: ["10/4"],
      }),
      sampleCourse({
        code: "10/4",
        name: "ELETRÔNICA",
        status: "locked",
      }),
    ]);

    assert.equal(courses[0]?.status, "locked");
  });
});

describe("buildFailedDisciplinaSet", () => {
  test("usa a tentativa mais recente do histórico", () => {
    const failed = buildFailedDisciplinaSet([
      historicoRow("02/2", "2025.1", "Reprovado"),
      historicoRow("02/2", "2026.1", "Aprovado"),
    ]);

    assert.equal(failed.has(normalizeDisciplinaCode("02/2")), false);
  });
});
