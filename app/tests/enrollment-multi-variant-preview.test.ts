import assert from "node:assert/strict";
import test from "node:test";
import { createEmptySchedule } from "@/config/mock/schedule";
import { buildSimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import {
  buildMultiVariantPreviewMap,
  buildPreviewCellSplitGradient,
  resolvePreviewCourseAtCell,
  resolvePreviewSegmentIndex,
  resolveVariantPreviewColor,
} from "@/lib/simulador/enrollment-multi-variant-preview";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

const placementContext = buildSimuladorPlacementContext({
  completedDisciplinaCodes: [],
  coRequisitos: {},
});

function turma(
  id: string,
  slots: { day: number; slot: number }[]
): TurmaOfertadaCourse {
  return {
    turmaSigaaId: id,
    code: "MAT001",
    name: "Matemática",
    semestre: "2025.1",
    color: "#3fb950",
    slots,
    coRequisitoCodes: [],
    waivedCoRequisitoCodes: [],
    pendingPrereqCodes: [],
    status: "unlocked",
    scheduleBlocker: false,
  } as TurmaOfertadaCourse;
}

test("buildMultiVariantPreviewMap — cor por variante e empilha no mesmo slot", () => {
  const schedule = createEmptySchedule();
  const variants = [
    turma("a", [{ day: 0, slot: 0 }]),
    turma("b", [{ day: 0, slot: 0 }, { day: 0, slot: 1 }]),
    turma("c", [{ day: 1, slot: 0 }]),
  ];

  const map = buildMultiVariantPreviewMap(
    variants,
    variants,
    schedule,
    placementContext,
    null
  );

  const shared = map.get("0:0");
  assert.equal(shared?.length, 2);
  assert.equal(shared?.[0]?.course.turmaSigaaId, "a");
  assert.equal(shared?.[0]?.color, resolveVariantPreviewColor(variants[0]!, 0));
  assert.equal(shared?.[1]?.course.turmaSigaaId, "b");
  assert.equal(shared?.[1]?.color, resolveVariantPreviewColor(variants[1]!, 1));
  assert.equal(map.get("0:1")?.[0]?.course.turmaSigaaId, "b");
});

test("buildPreviewCellSplitGradient — metade/metade e terços", () => {
  const half = buildPreviewCellSplitGradient(["#58a6ff", "#3d8fd4"]);
  assert.match(half ?? "", /linear-gradient\(to right/);
  assert.match(half ?? "", /50%/);

  const thirds = buildPreviewCellSplitGradient(["#58a6ff", "#3d8fd4", "#d4a843"]);
  assert.match(thirds ?? "", /33\.333333333333336%/);
});

test("resolvePreviewSegmentIndex — escolhe faixa pelo clique", () => {
  assert.equal(resolvePreviewSegmentIndex(2, 10, 100), 0);
  assert.equal(resolvePreviewSegmentIndex(2, 60, 100), 1);
  assert.equal(resolvePreviewSegmentIndex(3, 80, 100), 2);
});

test("resolvePreviewCourseAtCell — respeita índice da faixa", () => {
  const schedule = createEmptySchedule();
  const variants = [
    turma("a", [{ day: 0, slot: 0 }]),
    turma("b", [{ day: 0, slot: 0 }]),
  ];
  const map = buildMultiVariantPreviewMap(
    variants,
    variants,
    schedule,
    placementContext,
    null
  );

  assert.equal(
    resolvePreviewCourseAtCell(map, 0, 0, 0)?.turmaSigaaId,
    "a"
  );
  assert.equal(
    resolvePreviewCourseAtCell(map, 0, 0, 1)?.turmaSigaaId,
    "b"
  );
});

test("buildMultiVariantPreviewMap — omite variante em conflito", () => {
  const schedule = createEmptySchedule();
  schedule[0][0] = {
    code: "OUT",
    name: "OUT",
    room: "101",
    color: "#fff",
    turmaSigaaId: "other",
  };

  const variants = [
    turma("a", [{ day: 0, slot: 0 }]),
    turma("b", [{ day: 0, slot: 1 }]),
  ];

  const map = buildMultiVariantPreviewMap(
    variants,
    variants,
    schedule,
    placementContext,
    null
  );

  assert.equal(map.has("0:0"), false);
  assert.equal(map.get("0:1")?.[0]?.course.turmaSigaaId, "b");
});
