import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptySchedule } from "../src/config/mock/schedule";
import { turmaToSlotData } from "../src/lib/simulador/turma-course-utils";
import {
  isCorequisitoClusterPlacementViable,
  isMutualCorequisitoPartnerScheduleLocked,
  resolvePendingCorequisitoPartner,
} from "../src/lib/simulador/corequisito-cluster-viability";
import { buildSimuladorPlacementContext } from "../src/lib/simulador/corequisito-schedule-policy";
import { resolveEnrollmentCourseSelectability } from "../src/lib/simulador/enrollment-course-selectability";
import { resolveSelectedLockedCourseBlockingCellKeys } from "../src/lib/simulador/enrollment-schedule-highlights";
import {
  canPlaceTurmaOnSchedule,
  isCorequisitoPlacementBlocked,
  isTurmaScheduleLocked,
  placeTurmaOnSchedule,
  resolveTurmaBlockingCellKeys,
  scheduleCellKey,
} from "../src/lib/simulador/turma-schedule-placement";
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
  turmaSigaaId: string
) {
  schedule[day]![slot] = {
    ...turmaToSlotData(sampleCourse({ code, turmaSigaaId })),
    name: code,
  };
}

describe("corequisito-cluster-viability", () => {
  const context = buildSimuladorPlacementContext({
    completedDisciplinaCodes: [],
    coRequisitos: {
      "TEO/1": ["LAB/1"],
      "LAB/1": ["TEO/1"],
    },
  });

  const theory = sampleCourse({
    turmaSigaaId: "teo",
    code: "TEO/1",
    name: "TEORICA",
    slots: [{ day: 4, slot: 6 }],
  });
  const lab1 = sampleCourse({
    turmaSigaaId: "lab1",
    code: "LAB/1",
    name: "LABORATORIO",
    slots: [{ day: 0, slot: 0 }],
  });
  const lab2 = sampleCourse({
    turmaSigaaId: "lab2",
    code: "LAB/1",
    name: "LABORATORIO",
    slots: [{ day: 0, slot: 3 }],
  });
  const catalog = [theory, lab1, lab2];

  test("aleatória no horário da teórica não impede colocar lab — obriga teórica em seguida", () => {
    const schedule = createEmptySchedule();
    occupySlot(schedule, 4, 6, "ALE1", "ale1");

    assert.equal(isCorequisitoClusterPlacementViable(theory, schedule, context, catalog), false);
    assert.equal(isCorequisitoClusterPlacementViable(lab1, schedule, context, catalog), false);
    assert.equal(canPlaceTurmaOnSchedule(lab1, schedule, context), true);
    assert.equal(isCorequisitoPlacementBlocked(lab1, schedule, context), false);
  });

  test("aleatória só no horário do lab2 deixa lab1 e teórica viáveis", () => {
    const schedule = createEmptySchedule();
    occupySlot(schedule, 0, 3, "ALE2", "ale2");

    assert.equal(isCorequisitoClusterPlacementViable(lab2, schedule, context, catalog), false);
    assert.equal(isCorequisitoClusterPlacementViable(lab1, schedule, context, catalog), true);
    assert.equal(isCorequisitoClusterPlacementViable(theory, schedule, context, catalog), true);
  });

  test("aleatória nos dois horários de lab tranca todo o par", () => {
    const schedule = createEmptySchedule();
    occupySlot(schedule, 0, 0, "ALE3", "ale3a");
    occupySlot(schedule, 0, 3, "ALE3", "ale3b");

    assert.equal(isCorequisitoClusterPlacementViable(lab1, schedule, context, catalog), false);
    assert.equal(isCorequisitoClusterPlacementViable(lab2, schedule, context, catalog), false);
    assert.equal(isCorequisitoClusterPlacementViable(theory, schedule, context, catalog), false);
  });

  test("após alocar lab seleciona teórica parceira automaticamente", () => {
    const schedule = createEmptySchedule();
    const next = placeTurmaOnSchedule(lab1, schedule, context);
    const partner = resolvePendingCorequisitoPartner(
      lab1,
      next,
      context,
      catalog
    );

    assert.equal(partner?.turmaSigaaId, "teo");
    assert.equal(canPlaceTurmaOnSchedule(theory, next, context), true);
  });

  test("lab trancado quando teórica tem conflito mesmo com horário livre", () => {
    const schedule = createEmptySchedule();
    occupySlot(schedule, 4, 6, "ALE1", "ale1");

    assert.equal(isTurmaScheduleLocked(theory, schedule), true);
    assert.equal(isTurmaScheduleLocked(lab1, schedule), false);
    assert.equal(
      isMutualCorequisitoPartnerScheduleLocked(lab1, schedule, context, catalog),
      true
    );

    const labState = resolveEnrollmentCourseSelectability(
      lab1,
      catalog,
      schedule,
      context,
      null
    );
    assert.equal(labState.timeLocked, true);
    assert.equal(labState.coreqLockHighlight, true);
    assert.equal(labState.selectable, false);

    const keys = resolveSelectedLockedCourseBlockingCellKeys(
      lab1,
      catalog,
      schedule,
      context
    );
    assert.equal(keys.has(scheduleCellKey(4, 6)), true);
    assert.equal(
      resolveSelectedLockedCourseBlockingCellKeys(null, catalog, schedule, context)
        .size,
      0
    );
  });
});
