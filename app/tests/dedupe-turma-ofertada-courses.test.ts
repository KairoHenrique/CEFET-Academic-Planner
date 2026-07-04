import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildTurmaCourseFingerprint,
  dedupeTurmaOfertadaCourses,
} from "../src/lib/turmas-ofertadas/dedupe-turma-ofertada-courses";
import type { TurmaOfertadaCourse } from "../src/lib/types/turmas-ofertadas-api";

function sampleCourse(
  overrides: Partial<TurmaOfertadaCourse> = {}
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: "2026.2:A:atendida:2M34-4M34",
    code: "03/5",
    name: "ANÁLISE DE CIRCUITOS ELÉTRICOS",
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
    codigoHorario: "2M34 4M34",
    vagas: 40,
    slots: [
      { day: 1, slot: 3 },
      { day: 3, slot: 3 },
    ],
    situacao: "atendida",
    categoria: "curso",
    scheduleBlocker: false,
    scheduleWarningMessage: null,
    sigaaComponente: "COMP-A",
    departamento: null,
    ...overrides,
  };
}

describe("dedupe-turma-ofertada-courses", () => {
  test("colapsa mesma disciplina e horário com turma_sigaa_id diferente", () => {
    const deduped = dedupeTurmaOfertadaCourses([
      sampleCourse({ turmaSigaaId: "old-id-1", sigaaComponente: "COMP-A" }),
      sampleCourse({ turmaSigaaId: "old-id-2", sigaaComponente: "COMP-B" }),
    ]);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0]?.code, "03/5");
  });

  test("mantém turmas distintas no mesmo código com horários diferentes", () => {
    const deduped = dedupeTurmaOfertadaCourses([
      sampleCourse({ codigoHorario: "2M34", slots: [{ day: 1, slot: 3 }] }),
      sampleCourse({
        turmaSigaaId: "b",
        codigoHorario: "4M34",
        slots: [{ day: 3, slot: 3 }],
      }),
    ]);

    assert.equal(deduped.length, 2);
    assert.notEqual(
      buildTurmaCourseFingerprint(deduped[0]!),
      buildTurmaCourseFingerprint(deduped[1]!)
    );
  });

  test("prefere oferta atendida quando há duplicata pendente", () => {
    const deduped = dedupeTurmaOfertadaCourses([
      sampleCourse({
        turmaSigaaId: "pendente",
        situacao: "pendente",
        scheduleWarningMessage: "provisório",
      }),
      sampleCourse({
        turmaSigaaId: "atendida",
        situacao: "atendida",
        scheduleWarningMessage: null,
      }),
    ]);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0]?.situacao, "atendida");
  });
});
