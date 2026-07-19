import type { ScheduleSlot } from "../types";
import { parseSigaaCodigoHorario } from "./deps/parse-sigaa-codigo";
import type { ScheduleCellPosition } from "./deps/sigaa-slot-map";
import { areExclusiveEnrollmentVariants } from "./group-enrollment-courses";
import {
  pruneInvalidCorequisitoPlacements,
  resolveMissingCorequisitesForPlacement,
  type SimuladorPlacementContext,
} from "./corequisito-schedule-policy";
import type { TurmaOfertadaCourse } from "../types";
import { turmaToSlotData } from "./turma-course-utils";

function slotToVariantRef(slot: ScheduleSlot): TurmaOfertadaCourse | null {
  if (!slot?.turmaSigaaId) return null;

  return {
    turmaSigaaId: slot.turmaSigaaId,
    code: slot.code,
    name: slot.courseName ?? slot.name,
    semestre: slot.semestre ?? "",
  } as TurmaOfertadaCourse;
}

function slotBlocksCourse(
  slot: ScheduleSlot,
  course: TurmaOfertadaCourse
): boolean {
  if (!slot) return false;
  if (slot.turmaSigaaId === course.turmaSigaaId) return false;
  return true;
}

export function findPlacedExclusiveSibling(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): TurmaOfertadaCourse | null {
  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId || slot.turmaSigaaId === course.turmaSigaaId) {
        continue;
      }

      const occupant = slotToVariantRef(slot);
      if (!occupant) continue;

      if (
        areExclusiveEnrollmentVariants(course, {
          ...occupant,
          semestre: slot.semestre ?? course.semestre,
          name: slot.courseName ?? occupant.name,
        })
      ) {
        return {
          ...course,
          turmaSigaaId: slot.turmaSigaaId,
          code: slot.code,
          name: slot.courseName ?? slot.name,
          semestre: slot.semestre ?? course.semestre,
        };
      }
    }
  }

  return null;
}

export function scheduleCellKey(dayIdx: number, slotIdx: number): string {
  return `${dayIdx}:${slotIdx}`;
}

export function parseScheduleCellKey(key: string): ScheduleCellPosition | null {
  const [dayRaw, slotRaw] = key.split(":");
  const dayIdx = Number(dayRaw);
  const slotIdx = Number(slotRaw);
  if (!Number.isInteger(dayIdx) || !Number.isInteger(slotIdx)) return null;
  return { dayIdx, slotIdx };
}

export function getTurmaAllowedPositions(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): ScheduleCellPosition[] {
  const slots = course.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.map((slot) => ({
      dayIdx: slot.day,
      slotIdx: slot.slot,
    }));
  }

  return parseSigaaCodigoHorario(course.codigoHorario);
}

export function buildAllowedEmptyCellKeys(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): Set<string> {
  return new Set(
    getTurmaAllowedPositions(course).map(({ dayIdx, slotIdx }) =>
      scheduleCellKey(dayIdx, slotIdx)
    )
  );
}

export function getTurmaScheduleConflicts(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): ScheduleCellPosition[] {
  const positions = getTurmaAllowedPositions(course);
  if (positions.length === 0) return [];

  return positions.filter(({ dayIdx, slotIdx }) =>
    slotBlocksCourse(schedule[dayIdx]?.[slotIdx] ?? null, course)
  );
}

/** Células ocupadas na grade que impedem alocar a turma (`dayIdx:slotIdx`). */
export function resolveTurmaBlockingCellKeys(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): ReadonlySet<string> {
  if (course.scheduleBlocker || isTurmaPlacedOnSchedule(course, schedule)) {
    return new Set();
  }

  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  const conflicts = getTurmaScheduleConflicts(course, cleared);
  if (conflicts.length === 0) return new Set();

  return new Set(
    conflicts.map(({ dayIdx, slotIdx }) => scheduleCellKey(dayIdx, slotIdx))
  );
}

export function hasExclusiveSiblingPlaced(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): boolean {
  return findPlacedExclusiveSibling(course, schedule) !== null;
}

export function canPlaceTurmaBasic(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context?: SimuladorPlacementContext
): boolean {
  if (course.scheduleBlocker) return false;

  const positions = getTurmaAllowedPositions(course);
  if (positions.length === 0) return false;

  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  if (getTurmaScheduleConflicts(course, cleared).length > 0) return false;

  return true;
}

export function applyHypotheticalTurmaPlacement(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): ScheduleSlot[][] | null {
  if (!canPlaceTurmaBasic(course, schedule)) return null;

  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  const slotData = turmaToSlotData(course);
  const next = cleared.map((row) => [...row]);

  for (const { dayIdx, slotIdx } of getTurmaAllowedPositions(course)) {
    next[dayIdx][slotIdx] = slotData;
  }

  return next;
}

export function canPlaceTurmaOnSchedule(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context?: SimuladorPlacementContext
): boolean {
  return canPlaceTurmaBasic(course, schedule, context);
}

export function isTurmaPlacedOnSchedule(
  course: Pick<TurmaOfertadaCourse, "turmaSigaaId" | "slots" | "codigoHorario">,
  schedule: ScheduleSlot[][]
): boolean {
  const positions = getTurmaAllowedPositions(course);
  if (positions.length === 0) return false;

  return positions.every(({ dayIdx, slotIdx }) => {
    const slot = schedule[dayIdx]?.[slotIdx];
    return slot?.turmaSigaaId === course.turmaSigaaId;
  });
}

/** Disciplina já na grade — inclui qualquer variante exclusiva alocada. */
export function isDisciplinaPlacedOnSchedule(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): boolean {
  if (isTurmaPlacedOnSchedule(course, schedule)) return true;

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId) continue;

      const occupant = slotToVariantRef(slot);
      if (!occupant) continue;

      if (
        areExclusiveEnrollmentVariants(course, {
          ...occupant,
          semestre: slot.semestre ?? course.semestre,
          name: slot.courseName ?? occupant.name,
        })
      ) {
        return true;
      }
    }
  }

  return false;
}

/** Lista lateral: só turmas que ainda não estão na grade simulada. */
export function filterTurmasNotOnSchedule(
  courses: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][]
): TurmaOfertadaCourse[] {
  return courses.filter(
    (course) => !isDisciplinaPlacedOnSchedule(course, schedule)
  );
}

export function isTurmaScheduleLocked(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): boolean {
  if (course.scheduleBlocker) return false;
  if (isTurmaPlacedOnSchedule(course, schedule)) return false;

  const positions = getTurmaAllowedPositions(course);
  if (positions.length === 0) return true;

  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  return getTurmaScheduleConflicts(course, cleared).length > 0;
}

export function isVariantBlockedBySibling(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): boolean {
  return hasExclusiveSiblingPlaced(course, schedule);
}

/** Corequisitos não bloqueiam seleção — a obrigação pós-alocação força o parceiro. */
export function isCorequisitoPlacementBlocked(
  _course: TurmaOfertadaCourse,
  _schedule: ScheduleSlot[][],
  _context?: SimuladorPlacementContext
): boolean {
  return false;
}

export function getMissingCorequisitesForCourse(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): string[] {
  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  return resolveMissingCorequisitesForPlacement(course.code, cleared, context);
}

export function isAllowedPlacementCell(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">,
  dayIdx: number,
  slotIdx: number
): boolean {
  return getTurmaAllowedPositions(course).some(
    (position) => position.dayIdx === dayIdx && position.slotIdx === slotIdx
  );
}

function clearExclusiveSiblingsFromSchedule(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): ScheduleSlot[][] {
  return schedule.map((row) =>
    row.map((slot) => {
      if (!slot?.turmaSigaaId) return slot;
      if (slot.turmaSigaaId === course.turmaSigaaId) return null;

      const occupant = slotToVariantRef(slot);
      if (!occupant) return slot;

      return areExclusiveEnrollmentVariants(course, {
        ...occupant,
        semestre: slot.semestre ?? course.semestre,
        name: slot.courseName ?? occupant.name,
      })
        ? null
        : slot;
    })
  );
}

export function placeTurmaOnSchedule(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context?: SimuladorPlacementContext
): ScheduleSlot[][] {
  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  if (!canPlaceTurmaOnSchedule(course, cleared, context)) {
    return schedule;
  }

  const slotData = turmaToSlotData(course);
  const next = cleared.map((row) => [...row]);

  for (const { dayIdx, slotIdx } of getTurmaAllowedPositions(course)) {
    next[dayIdx][slotIdx] = slotData;
  }

  return next;
}

export interface TurmaScheduleConflictEntry {
  dayIdx: number;
  slotIdx: number;
  occupantCode: string;
  occupantName: string;
}

/** Ocupantes na grade que impedem alocar a turma (após limpar variantes exclusivas). */
export function resolveTurmaScheduleConflictEntries(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][]
): TurmaScheduleConflictEntry[] {
  if (course.scheduleBlocker || isTurmaPlacedOnSchedule(course, schedule)) {
    return [];
  }

  const cleared = clearExclusiveSiblingsFromSchedule(course, schedule);
  return getTurmaScheduleConflicts(course, cleared).map(({ dayIdx, slotIdx }) => {
    const slot = schedule[dayIdx]?.[slotIdx];
    return {
      dayIdx,
      slotIdx,
      occupantCode: slot?.code?.trim() ?? "",
      occupantName: slot?.courseName?.trim() ?? slot?.name?.trim() ?? "Turma alocada",
    };
  });
}

export function removeTurmaFromSchedule(
  turmaSigaaId: string,
  schedule: ScheduleSlot[][],
  context?: SimuladorPlacementContext
): ScheduleSlot[][] {
  const next = schedule.map((row) =>
    row.map((slot) => (slot?.turmaSigaaId === turmaSigaaId ? null : slot))
  );

  if (!context) return next;

  return pruneInvalidCorequisitoPlacements(next, context);
}

export const TURMA_SCHEDULE_CONFLICT_MESSAGE =
  "Horário em conflito com outra turma já alocada na grade simulada.";

export const TURMA_COREQUISITO_PARTNER_CONFLICT_MESSAGE =
  "Corequisito com horário em conflito na grade. Resolva o conflito da disciplina parceira.";

export const TURMA_EXCLUSIVE_VARIANT_MESSAGE =
  "Outro horário desta disciplina já está na grade. Selecione para substituir ou remova o atual.";

export const TURMA_COREQUISITO_PLACE_HINT =
  "Inclua também o(s) corequisito(s) na grade, salvo se já tiver sido aprovado nele(s).";

export const TURMA_SCHEDULE_PLACE_HINT =
  "Clique em um dos horários permitidos destacados na grade para alocar a turma.";
