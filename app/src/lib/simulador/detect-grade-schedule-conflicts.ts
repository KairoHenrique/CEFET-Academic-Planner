import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import { formatScheduleCellHorario } from "@/lib/simulador/turma-course-utils";
import {
  getTurmaAllowedPositions,
  scheduleCellKey,
} from "@/lib/simulador/turma-schedule-placement";
import { areExclusiveEnrollmentVariants } from "@/lib/simulador/group-enrollment-courses";
import type {
  SimuladorChoqueCell,
  SimuladorChoquePair,
  SimuladorChoquesResponse,
} from "@/lib/types/simulador-api";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface CellOccupant {
  course: TurmaOfertadaCourse;
  dayIdx: number;
  slotIdx: number;
}

function cellsOverlap(
  left: TurmaOfertadaCourse,
  right: TurmaOfertadaCourse
): SimuladorChoqueCell[] {
  const leftPositions = getTurmaAllowedPositions(left);
  const rightKeys = new Set(
    getTurmaAllowedPositions(right).map(({ dayIdx, slotIdx }) =>
      scheduleCellKey(dayIdx, slotIdx)
    )
  );

  const cells: SimuladorChoqueCell[] = [];
  for (const { dayIdx, slotIdx } of leftPositions) {
    const key = scheduleCellKey(dayIdx, slotIdx);
    if (!rightKeys.has(key)) continue;
    cells.push({
      dayIdx,
      slotIdx,
      horario: formatScheduleCellHorario(dayIdx, slotIdx),
    });
  }

  return cells;
}

function shouldReportConflict(
  left: TurmaOfertadaCourse,
  right: TurmaOfertadaCourse
): boolean {
  if (left.turmaSigaaId === right.turmaSigaaId) return false;
  if (areExclusiveEnrollmentVariants(left, right)) return false;
  return cellsOverlap(left, right).length > 0;
}

function buildConflictPair(
  left: TurmaOfertadaCourse,
  right: TurmaOfertadaCourse
): SimuladorChoquePair {
  const cells = cellsOverlap(left, right);
  const [a, b] =
    left.turmaSigaaId.localeCompare(right.turmaSigaaId) <= 0
      ? [left, right]
      : [right, left];

  return {
    turmaSigaaIdA: a.turmaSigaaId,
    codeA: normalizeDisciplinaCode(a.code),
    nameA: a.name,
    turmaSigaaIdB: b.turmaSigaaId,
    codeB: normalizeDisciplinaCode(b.code),
    nameB: b.name,
    cells,
  };
}

function dedupePairs(pairs: SimuladorChoquePair[]): SimuladorChoquePair[] {
  const seen = new Set<string>();
  const unique: SimuladorChoquePair[] = [];

  for (const pair of pairs) {
    const key = `${pair.turmaSigaaIdA}|${pair.turmaSigaaIdB}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(pair);
  }

  return unique;
}

function collectCellOccupants(courses: TurmaOfertadaCourse[]): CellOccupant[] {
  const occupants: CellOccupant[] = [];

  for (const course of courses) {
    for (const { dayIdx, slotIdx } of getTurmaAllowedPositions(course)) {
      occupants.push({ course, dayIdx, slotIdx });
    }
  }

  return occupants;
}

/** Detecta choques de horário entre turmas alocadas na mesma grade simulada. */
export function detectGradeScheduleConflicts(
  courses: TurmaOfertadaCourse[]
): SimuladorChoquePair[] {
  const pairs: SimuladorChoquePair[] = [];

  for (let i = 0; i < courses.length; i += 1) {
    for (let j = i + 1; j < courses.length; j += 1) {
      const left = courses[i];
      const right = courses[j];
      if (!shouldReportConflict(left, right)) continue;
      pairs.push(buildConflictPair(left, right));
    }
  }

  return dedupePairs(pairs);
}

export function buildChoquesResponse(input: {
  semestre: string;
  placements: TurmaOfertadaCourse[];
  invalidTurmaIds: string[];
  candidate?: TurmaOfertadaCourse;
}): SimuladorChoquesResponse {
  const baseConflicts = detectGradeScheduleConflicts(input.placements);
  const conflicts = [...baseConflicts];

  if (input.candidate) {
    for (const placed of input.placements) {
      if (!shouldReportConflict(input.candidate, placed)) continue;
      conflicts.push(buildConflictPair(input.candidate, placed));
    }
  }

  const merged = dedupePairs(conflicts);

  return {
    ok: true,
    semestre: input.semestre,
    hasConflicts: merged.length > 0,
    conflicts: merged,
    invalidTurmaIds: input.invalidTurmaIds,
  };
}

/** Valida se alguma célula da grade tem mais de um ocupante não exclusivo. */
export function hasCellCollision(occupants: CellOccupant[]): boolean {
  const byCell = new Map<string, TurmaOfertadaCourse[]>();

  for (const occupant of occupants) {
    const key = scheduleCellKey(occupant.dayIdx, occupant.slotIdx);
    const list = byCell.get(key) ?? [];
    list.push(occupant.course);
    byCell.set(key, list);
  }

  for (const courses of byCell.values()) {
    if (courses.length < 2) continue;
    for (let i = 0; i < courses.length; i += 1) {
      for (let j = i + 1; j < courses.length; j += 1) {
        if (shouldReportConflict(courses[i], courses[j])) return true;
      }
    }
  }

  return false;
}

export function collectOccupantsForCourses(
  courses: TurmaOfertadaCourse[]
): CellOccupant[] {
  return collectCellOccupants(courses);
}
