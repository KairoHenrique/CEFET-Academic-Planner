import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { resolvePpcEmenta } from "../src/lib/disciplinas/resolve-ppc-ementa";
import {
  computeWeeklyHoursFromPositions,
  formatSchedulePositions,
  resolveDisplayWeeklyHours,
  resolveSyncedSchedule,
  SCHEDULE_WEEKLY_HOURS_PER_SLOT,
} from "../src/lib/disciplinas/subject-schedule-meta";
import {
  resolveSubjectDisplayRoom,
  sanitizeSubjectRoom,
} from "../src/lib/disciplinas/subject-room";

describe("resolvePpcEmenta", () => {
  test("mostra só carga horária do PPC na ementa, sem período", () => {
    const ementa = resolvePpcEmenta("01/3", "Algoritmos e Estruturas de Dados I", 60);

    assert.match(ementa, /Carga horária: 60h/);
    assert.doesNotMatch(ementa, /período/i);
  });
});

describe("subject-schedule-meta", () => {
  test("calcula horas semanais a partir dos blocos do horário", () => {
    const positions = [
      { dayIdx: 0, slotIdx: 0 },
      { dayIdx: 2, slotIdx: 1 },
    ];

    assert.equal(
      computeWeeklyHoursFromPositions(positions),
      positions.length * SCHEDULE_WEEKLY_HOURS_PER_SLOT
    );
  });

  test("formata horário legível a partir do código SIGAA", () => {
    const schedule = resolveSyncedSchedule({
      codigo_horario: "4M12 6M56",
      horario_traduzido: null,
    });

    assert.match(schedule ?? "", /Qua 07:00/);
    assert.match(schedule ?? "", /Sex 10:50/);
  });

  test("prioriza horas semanais personalizadas", () => {
    assert.equal(
      resolveDisplayWeeklyHours({
        codigo_horario: "4M12",
        horario_traduzido: null,
        horario_exibicao: null,
        professor: null,
        professor_exibicao: null,
        horas_semanais_exibicao: 6,
      }),
      6
    );
  });

  test("formata posições em texto legível", () => {
    assert.equal(
      formatSchedulePositions([
        { dayIdx: 0, slotIdx: 0 },
        { dayIdx: 1, slotIdx: 3 },
      ]),
      "Seg 07:00 · Ter 13:50"
    );
  });
});

describe("subject-room", () => {
  test("prioriza sala personalizada sobre a do portal", () => {
    assert.equal(
      resolveSubjectDisplayRoom({
        local: "B304/B311",
        local_exibicao: "Lab 2",
      }),
      "Lab 2"
    );
  });

  test("sanitiza sala vazia como null", () => {
    assert.equal(sanitizeSubjectRoom("   "), null);
  });
});
