import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptySchedule } from "@/config/mock/schedule";
import { turmaToSlotData } from "@/lib/simulador/turma-course-utils";
import {
  isScheduleEmpty,
  resolvePlacedTurmasFromSchedule,
  summarizePlacedSchedule,
} from "@/lib/simulador/enrollment-schedule-stats";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> = {}
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: "t-1",
    code: "05/1",
    name: "Algoritmos e Estruturas de Dados I",
    status: "unlocked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    color: "#3AA0E8",
    room: "303",
    professor: "Prof. Teste",
    ch: 60,
    turmaCodigo: null,
    semestre: "2026.1",
    codigoHorario: "4M34",
    vagas: 30,
    slots: [{ day: 0, slot: 0 }],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    ...overrides,
  };
}

describe("enrollment-schedule-stats", () => {
  it("isScheduleEmpty on fresh grid", () => {
    assert.equal(isScheduleEmpty(createEmptySchedule()), true);
  });

  it("summarizePlacedSchedule counts unique turmas and CH once", () => {
    const schedule = createEmptySchedule();
    const slot = turmaToSlotData(sampleCourse());
    schedule[0][0] = slot;
    schedule[0][1] = slot;

    const stats = summarizePlacedSchedule(schedule, [sampleCourse()]);
    assert.equal(stats.placedCount, 1);
    assert.equal(stats.obrigatoriasCh, 60);
    assert.equal(stats.optativasCh, 0);
    assert.equal(stats.totalCh, 60);
    assert.deepEqual(stats.placedTurmaIds, ["t-1"]);
    assert.equal(isScheduleEmpty(schedule), false);
  });

  it("summarizePlacedSchedule splits CH by categoria", () => {
    const schedule = createEmptySchedule();
    const obrigatoria = sampleCourse({
      turmaSigaaId: "t-obr",
      ch: 60,
      categoria: "curso",
    });
    const optativa = sampleCourse({
      turmaSigaaId: "t-opt",
      code: "GT001",
      name: "Tópico Especial",
      ch: 30,
      categoria: "optativa",
      slots: [{ day: 1, slot: 1 }],
    });
    schedule[0][0] = turmaToSlotData(obrigatoria);
    schedule[1][1] = turmaToSlotData(optativa);

    const stats = summarizePlacedSchedule(schedule, [obrigatoria, optativa]);
    assert.equal(stats.placedCount, 2);
    assert.equal(stats.obrigatoriasCh, 60);
    assert.equal(stats.optativasCh, 30);
    assert.equal(stats.totalCh, 90);
  });

  it("resolvePlacedTurmasFromSchedule deduplicates by turmaSigaaId", () => {
    const course = sampleCourse({ turmaSigaaId: "t-redes" });
    const schedule = createEmptySchedule();
    const slot = turmaToSlotData(course);
    schedule[3][4] = slot;
    schedule[3][4] = slot;

    const placed = resolvePlacedTurmasFromSchedule(schedule, [course]);
    assert.equal(placed.length, 1);
    assert.equal(placed[0]?.turmaSigaaId, "t-redes");
  });
});
