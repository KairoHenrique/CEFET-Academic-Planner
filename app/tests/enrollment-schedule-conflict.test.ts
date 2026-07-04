import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptySchedule } from "../src/config/mock/schedule";
import { turmaToSlotData } from "../src/lib/simulador/turma-course-utils";
import { buildSimuladorPlacementContext } from "../src/lib/simulador/corequisito-schedule-policy";
import { shouldShowGroupScheduleConflictBadge } from "../src/lib/simulador/enrollment-course-selectability";
import { resolveEnrollmentScheduleConflictNotice } from "../src/lib/simulador/enrollment-schedule-conflict-notice";
import { isMutualCorequisitoPartnerScheduleLocked } from "../src/lib/simulador/corequisito-cluster-viability";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> = {}
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: "id",
    code: "X",
    name: "DISCIPLINA X",
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
    codigoHorario: "4M34",
    vagas: 30,
    slots: [{ day: 0, slot: 3 }],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: "X",
    departamento: null,
    ...overrides,
  };
}

function occupySlot(
  schedule: ReturnType<typeof createEmptySchedule>,
  day: number,
  slot: number,
  code: string,
  turmaSigaaId: string,
  name?: string
) {
  schedule[day]![slot] = {
    ...turmaToSlotData(sampleCourse({ code, turmaSigaaId, name: name ?? code })),
    name: code,
    courseName: name ?? code,
  };
}

describe("enrollment-schedule-conflict", () => {
  const context = buildSimuladorPlacementContext({
    completedDisciplinaCodes: [],
    coRequisitos: {
      "TEO/1": ["LAB/1"],
      "LAB/1": ["TEO/1"],
    },
  });

  test("badge conflito em multi-horário só quando todos estão trancados", () => {
    const variantA = sampleCourse({
      turmaSigaaId: "red-a",
      code: "RED/1",
      name: "REDES A",
      slots: [{ day: 0, slot: 0 }],
    });
    const variantB = sampleCourse({
      turmaSigaaId: "red-b",
      code: "RED/1",
      name: "REDES A",
      slots: [{ day: 0, slot: 3 }],
    });
    const catalog = [variantA, variantB];
    const schedule = createEmptySchedule();

    assert.equal(
      shouldShowGroupScheduleConflictBadge(
        [variantA, variantB],
        catalog,
        schedule,
        context
      ),
      false
    );

    occupySlot(schedule, 0, 0, "ALE1", "ale1", "Aleatória I");
    assert.equal(
      shouldShowGroupScheduleConflictBadge(
        [variantA, variantB],
        catalog,
        schedule,
        context
      ),
      false
    );

    occupySlot(schedule, 0, 3, "ALE2", "ale2", "Aleatória II");
    assert.equal(
      shouldShowGroupScheduleConflictBadge(
        [variantA, variantB],
        catalog,
        schedule,
        context
      ),
      true
    );
  });

  test("badge conflito com 3+ horários exige todos trancados", () => {
    const variantA = sampleCourse({
      turmaSigaaId: "calc-a",
      code: "CALC/1",
      name: "CALCULO",
      slots: [{ day: 0, slot: 0 }],
    });
    const variantB = sampleCourse({
      turmaSigaaId: "calc-b",
      code: "CALC/1",
      name: "CALCULO",
      slots: [{ day: 0, slot: 1 }],
    });
    const variantC = sampleCourse({
      turmaSigaaId: "calc-c",
      code: "CALC/1",
      name: "CALCULO",
      slots: [{ day: 0, slot: 2 }],
    });
    const variants = [variantA, variantB, variantC];
    const catalog = variants;
    const schedule = createEmptySchedule();

    occupySlot(schedule, 0, 0, "ALE1", "ale1");
    occupySlot(schedule, 0, 1, "ALE2", "ale2");
    assert.equal(
      shouldShowGroupScheduleConflictBadge(variants, catalog, schedule, context),
      false
    );

    occupySlot(schedule, 0, 2, "ALE3", "ale3");
    assert.equal(
      shouldShowGroupScheduleConflictBadge(variants, catalog, schedule, context),
      true
    );
  });

  test("badge conflito aparece quando coreq parceiro tranca a disciplina", () => {
    const theory = sampleCourse({
      turmaSigaaId: "teo",
      code: "TEO/1",
      name: "TEORICA",
      slots: [{ day: 4, slot: 6 }],
    });
    const lab = sampleCourse({
      turmaSigaaId: "lab",
      code: "LAB/1",
      name: "LABORATORIO",
      slots: [{ day: 1, slot: 1 }],
    });
    const catalog = [theory, lab];
    const schedule = createEmptySchedule();
    occupySlot(schedule, 4, 6, "ALE1", "ale1", "Aleatória I");

    assert.equal(
      isMutualCorequisitoPartnerScheduleLocked(lab, schedule, context, catalog),
      true
    );
    assert.equal(
      shouldShowGroupScheduleConflictBadge([lab], catalog, schedule, context),
      false
    );
  });

  test("popup resume conflito com nickname, nome e horário", () => {
    const target = sampleCourse({
      turmaSigaaId: "teo",
      code: "TEO/1",
      name: "TEORICA",
      shortLabel: "TEO",
      slots: [{ day: 4, slot: 6 }],
    });
    const catalog = [target];
    const schedule = createEmptySchedule();
    occupySlot(schedule, 4, 6, "ALE1", "ale1", "Aleatória I");

    const notice = resolveEnrollmentScheduleConflictNotice(
      target,
      catalog,
      schedule,
      context
    );

    assert.ok(notice);
    assert.equal(notice?.kind, "direct");
    assert.equal(notice?.selectedShortLabel, "TEO");
    assert.equal(notice?.conflicts[0]?.name, "Aleatória I");
    assert.match(notice?.conflicts[0]?.horario ?? "", /Sex/);
  });

  test("popup de coreq parceiro aponta disciplina bloqueadora", () => {
    const theory = sampleCourse({
      turmaSigaaId: "teo",
      code: "TEO/1",
      name: "TEORICA",
      shortLabel: "TEO",
      slots: [{ day: 4, slot: 6 }],
    });
    const lab = sampleCourse({
      turmaSigaaId: "lab",
      code: "LAB/1",
      name: "LABORATORIO",
      shortLabel: "LAB",
      slots: [{ day: 1, slot: 1 }],
    });
    const catalog = [theory, lab];
    const schedule = createEmptySchedule();
    occupySlot(schedule, 4, 6, "ALE1", "ale1", "Aleatória I");

    const notice = resolveEnrollmentScheduleConflictNotice(
      lab,
      catalog,
      schedule,
      context
    );

    assert.ok(notice);
    assert.equal(notice?.kind, "partner");
    assert.equal(notice?.partnerShortLabel, "TEO");
    assert.equal(notice?.conflicts[0]?.name, "Aleatória I");
  });
});
