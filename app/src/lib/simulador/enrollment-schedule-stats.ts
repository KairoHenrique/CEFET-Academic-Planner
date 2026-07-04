import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export interface EnrollmentScheduleStats {
  placedCount: number;
  totalCh: number;
  placedTurmaIds: string[];
}

/** Conta turmas únicas na grade e soma CH uma vez por turma. */
export function summarizePlacedSchedule(
  schedule: ScheduleSlot[][]
): EnrollmentScheduleStats {
  const chByTurma = new Map<string, number>();

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId || chByTurma.has(slot.turmaSigaaId)) continue;
      chByTurma.set(slot.turmaSigaaId, slot.ch ?? 0);
    }
  }

  let totalCh = 0;
  for (const ch of chByTurma.values()) totalCh += ch;

  return {
    placedCount: chByTurma.size,
    totalCh,
    placedTurmaIds: [...chByTurma.keys()],
  };
}

export function isScheduleEmpty(schedule: ScheduleSlot[][]): boolean {
  for (const row of schedule) {
    for (const slot of row) {
      if (slot?.turmaSigaaId) return false;
    }
  }
  return true;
}

/** Turmas únicas alocadas na grade, resolvidas no catálogo SIGAA. */
export function resolvePlacedTurmasFromSchedule(
  schedule: ScheduleSlot[][],
  catalog: TurmaOfertadaCourse[]
): TurmaOfertadaCourse[] {
  const byTurmaId = new Map<string, TurmaOfertadaCourse>();

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId || byTurmaId.has(slot.turmaSigaaId)) continue;

      const course = catalog.find(
        (item) => item.turmaSigaaId === slot.turmaSigaaId
      );
      if (course) byTurmaId.set(slot.turmaSigaaId, course);
    }
  }

  return [...byTurmaId.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR")
  );
}
