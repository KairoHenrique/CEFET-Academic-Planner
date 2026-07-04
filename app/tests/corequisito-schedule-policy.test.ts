import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptySchedule } from "../src/config/mock/schedule";
import {
  buildSimuladorPlacementContext,
  isMutualCorequisite,
  pruneInvalidCorequisitoPlacements,
  resolveMissingCorequisitesForPlacement,
  resolveMissingCorequisitesOnSchedule,
} from "../src/lib/simulador/corequisito-schedule-policy";
import { placeTurmaOnSchedule } from "../src/lib/simulador/turma-schedule-placement";
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
    codigoHorario: "4M34",
    vagas: 30,
    slots: [{ day: 0, slot: 3 }],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: "TEST",
    departamento: null,
    ...overrides,
  };
}

describe("corequisito-schedule-policy", () => {
  test("detecta par mútuo teoria/lab", () => {
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: {
        "05/1": ["05/2"],
        "05/2": ["05/1"],
      },
    });

    assert.equal(isMutualCorequisite("05/1", "05/2", context), true);
    assert.equal(isMutualCorequisite("05/1", "10/3", context), false);
  });

  test("bloqueia corequisito unilateral até parceiro entrar na grade", () => {
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: {
        "08/3": ["10/3"],
      },
    });
    const theory = sampleCourse({
      turmaSigaaId: "t1",
      code: "08/3",
      name: "INTRODUCAO A PROGRAMACAO",
    });
    const schedule = createEmptySchedule();

    assert.deepEqual(
      resolveMissingCorequisitesForPlacement("08/3", schedule, context),
      ["10/3"]
    );
    assert.deepEqual(
      resolveMissingCorequisitesOnSchedule("08/3", schedule, context),
      ["10/3"]
    );

    const withLab = placeTurmaOnSchedule(
      sampleCourse({
        turmaSigaaId: "t2",
        code: "10/3",
        name: "LAB INTRODUCAO A PROGRAMACAO",
        slots: [{ day: 1, slot: 1 }],
      }),
      schedule,
      context
    );
    const placed = placeTurmaOnSchedule(theory, withLab, context);

    assert.equal(placed[0]?.[3]?.code, "08/3");
  });

  test("pares mútuos podem ser alocados em sequência", () => {
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: {
        "05/1": ["05/2"],
        "05/2": ["05/1"],
      },
    });
    const lab = sampleCourse({
      turmaSigaaId: "lab",
      code: "05/2",
      name: "LAB ALGORITMOS I",
      slots: [{ day: 2, slot: 1 }],
    });
    const theory = sampleCourse({
      turmaSigaaId: "th",
      code: "05/1",
      name: "ALGORITMOS I",
      slots: [{ day: 0, slot: 3 }],
    });

    assert.deepEqual(
      resolveMissingCorequisitesForPlacement("05/1", createEmptySchedule(), context),
      []
    );

    const afterLab = placeTurmaOnSchedule(lab, createEmptySchedule(), context);
    const afterBoth = placeTurmaOnSchedule(theory, afterLab, context);

    assert.deepEqual(
      resolveMissingCorequisitesOnSchedule("05/1", afterBoth, context),
      []
    );
    assert.deepEqual(
      resolveMissingCorequisitesOnSchedule("05/2", afterBoth, context),
      []
    );
  });

  test("aprovação no histórico dispensa corequisito na grade", () => {
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: ["10/3"],
      coRequisitos: {
        "08/3": ["10/3"],
      },
    });

    assert.deepEqual(
      resolveMissingCorequisitesForPlacement(
        "08/3",
        createEmptySchedule(),
        context
      ),
      []
    );
  });

  test("remove dependentes quando parceiro sai da grade", () => {
    const context = buildSimuladorPlacementContext({
      completedDisciplinaCodes: [],
      coRequisitos: {
        "08/3": ["10/3"],
        "10/3": ["08/3"],
      },
    });
    const theory = sampleCourse({
      turmaSigaaId: "th",
      code: "08/3",
      name: "INTRODUCAO A PROGRAMACAO",
      slots: [{ day: 0, slot: 3 }],
    });
    const lab = sampleCourse({
      turmaSigaaId: "lab",
      code: "10/3",
      name: "LAB INTRODUCAO A PROGRAMACAO",
      slots: [{ day: 1, slot: 1 }],
    });

    let schedule = placeTurmaOnSchedule(theory, createEmptySchedule(), context);
    schedule = placeTurmaOnSchedule(lab, schedule, context);

    const pruned = pruneInvalidCorequisitoPlacements(
      schedule.map((row) =>
        row.map((slot) => (slot?.turmaSigaaId === "lab" ? null : slot))
      ),
      context
    );

    assert.equal(pruned[0]?.[3], null);
    assert.equal(pruned[1]?.[1], null);
  });
});
