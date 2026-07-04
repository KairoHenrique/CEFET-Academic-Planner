import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptySchedule } from "../src/config/mock/schedule";
import { turmaToSlotData } from "../src/lib/simulador/turma-course-utils";
import {
  canPlaceTurmaOnSchedule,
  filterTurmasNotOnSchedule,
  getTurmaScheduleConflicts,
  getTurmaAllowedPositions,
  isAllowedPlacementCell,
  isTurmaPlacedOnSchedule,
  isTurmaScheduleLocked,
  isVariantBlockedBySibling,
  placeTurmaOnSchedule,
  removeTurmaFromSchedule,
} from "../src/lib/simulador/turma-schedule-placement";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> = {}
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: "2026.2:TEST:atendida:4M34",
    code: "TEST",
    name: "Disciplina Teste",
    status: "unlocked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    color: "#000",
    room: "101",
    professor: "Prof.",
    ch: 60,
    turmaCodigo: null,
    semestre: "2026.2",
    codigoHorario: "4M34 2T12",
    vagas: 30,
    slots: [
      { day: 0, slot: 3 },
      { day: 2, slot: 1 },
    ],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: "TEST",
    departamento: null,
    ...overrides,
  };
}

describe("turma-schedule-placement", () => {
  test("só permite clique nas células do horário SIGAA", () => {
    const course = sampleCourse();
    assert.equal(isAllowedPlacementCell(course, 0, 3), true);
    assert.equal(isAllowedPlacementCell(course, 0, 0), false);
  });

  test("usa codigoHorario quando slots não veio da API", () => {
    const course = sampleCourse({
      slots: undefined as unknown as TurmaOfertadaCourse["slots"],
      codigoHorario: "4M34 2T12",
    });

    assert.ok(getTurmaAllowedPositions(course).length > 0);
    assert.doesNotThrow(() => isAllowedPlacementCell(course, 0, 3));
  });

  test("aloca todos os slots da turma de uma vez", () => {
    const course = sampleCourse();
    const schedule = createEmptySchedule();
    const next = placeTurmaOnSchedule(course, schedule);

    assert.ok(next[0]?.[3]);
    assert.ok(next[2]?.[1]);
    assert.equal(isTurmaPlacedOnSchedule(course, next), true);
  });

  test("bloqueia turma quando algum slot já está ocupado", () => {
    const courseA = sampleCourse({
      turmaSigaaId: "a",
      code: "A",
      name: "DISCIPLINA A",
      slots: [{ day: 0, slot: 3 }],
    });
    const courseB = sampleCourse({
      turmaSigaaId: "b",
      code: "B",
      name: "DISCIPLINA B",
      slots: [
        { day: 0, slot: 3 },
        { day: 1, slot: 1 },
      ],
    });

    const schedule = placeTurmaOnSchedule(courseA, createEmptySchedule());

    assert.equal(canPlaceTurmaOnSchedule(courseB, schedule), false);
    assert.equal(isTurmaScheduleLocked(courseB, schedule), true);
    assert.deepEqual(getTurmaScheduleConflicts(courseB, schedule), [
      { dayIdx: 0, slotIdx: 3 },
    ]);
  });

  test("bloqueia outra variante da mesma disciplina já alocada", () => {
    const placed = sampleCourse({ turmaSigaaId: "id-1", code: "03/5" });
    const sibling = sampleCourse({
      turmaSigaaId: "id-2",
      code: "03/5",
      codigoHorario: "46M34",
      slots: [{ day: 4, slot: 3 }],
    });
    const schedule = placeTurmaOnSchedule(placed, createEmptySchedule());

    assert.equal(canPlaceTurmaOnSchedule(sibling, schedule), true);
    assert.equal(isVariantBlockedBySibling(sibling, schedule), true);
    assert.equal(isTurmaScheduleLocked(sibling, schedule), false);
  });

  test("substitui variante anterior ao alocar outra do mesmo grupo", () => {
    const first = sampleCourse({ turmaSigaaId: "id-1", code: "03/5" });
    const second = sampleCourse({
      turmaSigaaId: "id-2",
      code: "03/5",
      codigoHorario: "46M34",
      slots: [{ day: 4, slot: 3 }],
    });

    const afterFirst = placeTurmaOnSchedule(first, createEmptySchedule());
    const afterSecond = placeTurmaOnSchedule(second, afterFirst);

    assert.equal(isTurmaPlacedOnSchedule(first, afterSecond), false);
    assert.equal(isTurmaPlacedOnSchedule(second, afterSecond), true);
  });

  test("remove turma inteira da grade", () => {
    const course = sampleCourse();
    const placed = placeTurmaOnSchedule(course, createEmptySchedule());
    const cleared = removeTurmaFromSchedule(course.turmaSigaaId, placed);

    assert.equal(isTurmaPlacedOnSchedule(course, cleared), false);
    assert.equal(cleared[0]?.[3], null);
    assert.equal(cleared[2]?.[1], null);
  });

  test("filterTurmasNotOnSchedule oculta disciplina já alocada e variantes", () => {
    const placed = sampleCourse({ turmaSigaaId: "id-1", code: "03/5" });
    const sibling = sampleCourse({
      turmaSigaaId: "id-2",
      code: "03/5",
      name: "DISCIPLINA TESTE",
      slots: [{ day: 4, slot: 3 }],
    });
    const other = sampleCourse({ turmaSigaaId: "other", code: "04/5", name: "OUTRA" });
    const schedule = placeTurmaOnSchedule(placed, createEmptySchedule());
    const visible = filterTurmasNotOnSchedule([placed, sibling, other], schedule);

    assert.deepEqual(
      visible.map((item) => item.turmaSigaaId),
      ["other"]
    );
  });

  test("turmaToSlotData carrega turmaSigaaId para rastrear conflitos", () => {
    const course = sampleCourse({
      code: "08/3",
      name: "INTRODUCAO A PROGRAMACAO DE COMPUTADORES",
    });
    assert.equal(turmaToSlotData(course).turmaSigaaId, course.turmaSigaaId);
    assert.equal(turmaToSlotData(course).name, "PRO");
    assert.equal(turmaToSlotData(course).code, "08/3");
  });

  test("formatTurmaShortLabel usa sigla do nome PPC", async () => {
    const { formatTurmaShortLabel } = await import(
      "../src/lib/simulador/turma-course-utils"
    );

    assert.equal(
      formatTurmaShortLabel({
        code: "08/3",
        name: "Introdução à Programação de Computadores",
      }),
      "PRO"
    );
    assert.equal(
      formatTurmaShortLabel({
        code: "05/1",
        name: "Algoritmos e Estruturas de Dados I",
      }),
      "AEDI"
    );
  });

  test("permite alocar corequisito unilateral antes do parceiro na grade", async () => {
    const { buildSimuladorPlacementContext } = await import(
      "../src/lib/simulador/corequisito-schedule-policy"
    );
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: { "08/3": ["10/3"] },
    });
    const theory = sampleCourse({
      turmaSigaaId: "th",
      code: "08/3",
      name: "INTRODUCAO A PROGRAMACAO",
      slots: [{ day: 0, slot: 3 }],
    });

    assert.equal(canPlaceTurmaOnSchedule(theory, createEmptySchedule(), context), true);

    const placed = placeTurmaOnSchedule(theory, createEmptySchedule(), context);
    assert.equal(placed[0]?.[3]?.code, "08/3");
  });
});
