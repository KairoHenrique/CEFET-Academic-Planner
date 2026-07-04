import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptySchedule } from "../src/config/mock/schedule";
import {
  isCorequisitoPartnerSelection,
  resolveActiveCorequisitoObligation,
} from "../src/lib/simulador/corequisito-cluster-viability";
import { buildSimuladorPlacementContext } from "../src/lib/simulador/corequisito-schedule-policy";
import { placeTurmaOnSchedule } from "../src/lib/simulador/turma-schedule-placement";
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

describe("corequisito-obligation", () => {
  const context = buildSimuladorPlacementContext({
    completedDisciplinaCodes: [],
    coRequisitos: {
      "TEO/1": ["LAB/1"],
      "LAB/1": ["TEO/1"],
    },
  });

  const lab = sampleCourse({
    turmaSigaaId: "lab",
    code: "LAB/1",
    name: "LABORATORIO",
    slots: [{ day: 0, slot: 0 }],
  });
  const theory = sampleCourse({
    turmaSigaaId: "teo",
    code: "TEO/1",
    name: "TEORICA",
    slots: [{ day: 4, slot: 6 }],
  });
  const other = sampleCourse({
    turmaSigaaId: "other",
    code: "OUT/1",
    name: "OUTRA",
  });

  test("após alocar metade do par, obriga seleção do corequisito", () => {
    const schedule = placeTurmaOnSchedule(lab, createEmptySchedule(), context);
    const obligation = resolveActiveCorequisitoObligation(schedule, context);

    assert.deepEqual(obligation, { partnerCode: "TEO/1" });
    assert.equal(isCorequisitoPartnerSelection(theory, obligation), true);
    assert.equal(isCorequisitoPartnerSelection(other, obligation), false);
  });

  test("par teoria/lab do PPC gera obrigação após alocar metade", () => {
    const redesContext = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: {
        "07/4": ["11/4"],
        "11/4": ["07/4"],
      },
    });
    const redes = sampleCourse({
      turmaSigaaId: "redes",
      code: "07/4",
      name: "REDES DE COMPUTADORES I",
      slots: [{ day: 2, slot: 2 }],
    });
    const labRedes = sampleCourse({
      turmaSigaaId: "lab-redes",
      code: "11/4",
      name: "LAB REDES DE COMPUTADORES I",
      slots: [{ day: 3, slot: 3 }],
    });

    const schedule = placeTurmaOnSchedule(
      redes,
      createEmptySchedule(),
      redesContext
    );
    const obligation = resolveActiveCorequisitoObligation(schedule, redesContext);

    assert.deepEqual(obligation, { partnerCode: "11/4" });
    assert.equal(isCorequisitoPartnerSelection(labRedes, obligation), true);
    assert.equal(isCorequisitoPartnerSelection(redes, obligation), false);
  });
});
