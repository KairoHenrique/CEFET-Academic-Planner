import { createEmptySchedule, type ScheduleSlot } from "../types";
import type { SimuladorPlacementContext } from "./corequisito-schedule-policy";
import {
  canPlaceTurmaOnSchedule,
  placeTurmaOnSchedule,
} from "./turma-schedule-placement";
import type { TurmaOfertadaCourse } from "../types";

/** Reconstrói a grade a partir dos IDs salvos na simulação. */
export function buildScheduleFromTurmaIds(
  turmaSigaaIds: readonly string[],
  catalog: TurmaOfertadaCourse[],
  placementContext: SimuladorPlacementContext
): ScheduleSlot[][] {
  const byId = new Map(
    catalog.map((course) => [course.turmaSigaaId, course] as const)
  );

  let schedule = createEmptySchedule();

  for (const turmaSigaaId of turmaSigaaIds) {
    const course = byId.get(turmaSigaaId);
    if (!course) continue;
    if (!canPlaceTurmaOnSchedule(course, schedule, placementContext)) continue;
    schedule = placeTurmaOnSchedule(course, schedule, placementContext);
  }

  return schedule;
}
