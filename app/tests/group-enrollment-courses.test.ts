import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { groupEnrollmentCourses } from "../src/lib/simulador/group-enrollment-courses";
import {
  isEnrollmentLaboratoryName,
  sortEnrollmentCourseGroups,
} from "../src/lib/simulador/sort-enrollment-course-groups";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> = {}
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: "a",
    code: "05/4",
    name: "COMPUTAÇÃO GRÁFICA",
    status: "unlocked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    color: "#000",
    room: "—",
    professor: "—",
    ch: 60,
    turmaCodigo: null,
    semestre: "2026.2",
    codigoHorario: "46M56",
    vagas: 30,
    slots: [{ day: 4, slot: 5 }],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: null,
    departamento: null,
    ...overrides,
  };
}

describe("sort-enrollment-course-groups", () => {
  test("detecta laboratório pelo nome", () => {
    assert.equal(
      isEnrollmentLaboratoryName("Laboratório de Algoritmos e Estruturas de Dados I"),
      true
    );
    assert.equal(
      isEnrollmentLaboratoryName("Algoritmos e Estruturas de Dados I"),
      false
    );
  });

  test("ordena par corequisito com teoria acima do laboratório", () => {
    const groups = groupEnrollmentCourses([
      sampleCourse({
        turmaSigaaId: "lab",
        code: "10/3",
        name: "LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I",
        coRequisitoCodes: ["08/3"],
      }),
      sampleCourse({
        turmaSigaaId: "th",
        code: "08/3",
        name: "ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I",
        coRequisitoCodes: ["10/3"],
      }),
    ]);

    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.code, "08/3");
    assert.equal(groups[1]?.code, "10/3");
  });

  test("mantém ordem alfabética quando não há par teoria/lab", () => {
    const groups = sortEnrollmentCourseGroups([
      {
        id: "z",
        code: "99/9",
        name: "Zoologia",
        color: "#000",
        semestre: "2026.2",
        variants: [sampleCourse({ turmaSigaaId: "z", code: "99/9", name: "Zoologia" })],
        multiVariant: false,
      },
      {
        id: "a",
        code: "01/1",
        name: "Algoritmos",
        color: "#000",
        semestre: "2026.2",
        variants: [sampleCourse({ turmaSigaaId: "a", code: "01/1", name: "Algoritmos" })],
        multiVariant: false,
      },
    ]);

    assert.deepEqual(
      groups.map((group) => group.name),
      ["Algoritmos", "Zoologia"]
    );
  });

  test("não reordena corequisito quando ambos são teóricos", () => {
    const groups = sortEnrollmentCourseGroups([
      {
        id: "b",
        code: "02/2",
        name: "Banco de Dados",
        color: "#000",
        semestre: "2026.2",
        variants: [
          sampleCourse({
            turmaSigaaId: "b",
            code: "02/2",
            name: "Banco de Dados",
            coRequisitoCodes: ["03/3"],
          }),
        ],
        multiVariant: false,
      },
      {
        id: "c",
        code: "03/3",
        name: "Compiladores",
        color: "#000",
        semestre: "2026.2",
        variants: [
          sampleCourse({
            turmaSigaaId: "c",
            code: "03/3",
            name: "Compiladores",
            coRequisitoCodes: ["02/2"],
          }),
        ],
        multiVariant: false,
      },
    ]);

    assert.deepEqual(
      groups.map((group) => group.name),
      ["Banco de Dados", "Compiladores"]
    );
  });
});

describe("group-enrollment-courses", () => {
  test("agrupa mesmo código com horários diferentes", () => {
    const groups = groupEnrollmentCourses([
      sampleCourse({ turmaSigaaId: "1", codigoHorario: "46M56" }),
      sampleCourse({ turmaSigaaId: "2", codigoHorario: "46M34", slots: [{ day: 4, slot: 3 }] }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.multiVariant, true);
    assert.equal(groups[0]?.variants.length, 2);
  });

  test("agrupa nomes exatamente iguais com códigos diferentes", () => {
    const groups = groupEnrollmentCourses([
      sampleCourse({ turmaSigaaId: "1", code: "GT01", name: "APRENDIZADO DE MÁQUINA" }),
      sampleCourse({ turmaSigaaId: "2", code: "GT02", name: "APRENDIZADO DE MÁQUINA" }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.multiVariant, true);
  });

  test("mantém disciplinas únicas como item simples", () => {
    const groups = groupEnrollmentCourses([
      sampleCourse({ turmaSigaaId: "1", code: "01/1" }),
      sampleCourse({ turmaSigaaId: "2", code: "02/2", name: "OUTRA DISCIPLINA" }),
    ]);

    assert.equal(groups.length, 2);
    assert.equal(groups.every((group) => !group.multiVariant), true);
  });
});
