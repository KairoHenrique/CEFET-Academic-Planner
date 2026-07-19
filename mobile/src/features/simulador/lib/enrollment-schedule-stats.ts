import type { ScheduleSlot } from "../types";
import type {
  TurmaOfertadaCategoriaApi,
  TurmaOfertadaCourse,
} from "../types";

export interface EnrollmentScheduleStats {
  placedCount: number;
  obrigatoriasCh: number;
  optativasCh: number;
  totalCh: number;
  placedTurmaIds: string[];
}

/** Conta turmas únicas na grade e soma CH uma vez por turma. */
export function summarizePlacedSchedule(
  schedule: ScheduleSlot[][],
  catalog: TurmaOfertadaCourse[] = []
): EnrollmentScheduleStats {
  const catalogByTurmaId = new Map(
    catalog.map((course) => [course.turmaSigaaId, course])
  );
  const chByTurma = new Map<string, number>();
  const categoriaByTurma = new Map<string, TurmaOfertadaCategoriaApi>();

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId || chByTurma.has(slot.turmaSigaaId)) continue;
      chByTurma.set(slot.turmaSigaaId, slot.ch ?? 0);
      categoriaByTurma.set(
        slot.turmaSigaaId,
        catalogByTurmaId.get(slot.turmaSigaaId)?.categoria ?? "curso"
      );
    }
  }

  let obrigatoriasCh = 0;
  let optativasCh = 0;

  for (const [turmaId, ch] of chByTurma) {
    if (categoriaByTurma.get(turmaId) === "optativa") {
      optativasCh += ch;
    } else {
      obrigatoriasCh += ch;
    }
  }

  return {
    placedCount: chByTurma.size,
    obrigatoriasCh,
    optativasCh,
    totalCh: obrigatoriasCh + optativasCh,
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
