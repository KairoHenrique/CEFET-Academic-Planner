"use client";

import { formatTurmaHorarioChip } from "@/lib/simulador/turma-course-utils";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentCourseSlotChipProps {
  course: TurmaOfertadaCourse;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selected: boolean;
  onSelect: (course: TurmaOfertadaCourse) => void;
}

export function EnrollmentCourseSlotChip({
  course,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selected,
  onSelect,
}: EnrollmentCourseSlotChipProps) {
  const state = resolveEnrollmentCourseSelectability(
    course,
    catalog,
    schedule,
    placementContext,
    corequisitoObligation
  );
  const horarioLabel = formatTurmaHorarioChip(course) ?? "Sem horário";

  return (
    <button
      type="button"
      disabled={!state.selectable && !state.timeLocked}
      className={[
        "enrollment-course-slot-chip",
        course.scheduleBlocker ? "is-blocked" : "",
        state.timeLocked ? "is-locked" : "",
        state.coreqLockHighlight ? "coreq-lock-highlight" : "",
        state.schedulePlaced ? "is-placed" : "",
        selected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(course)}
      aria-pressed={selected}
      aria-label={`${course.name}, ${horarioLabel}`}
      title={state.tooltip}
    >
      <span className="enrollment-course-slot-chip-time">{horarioLabel}</span>
    </button>
  );
}
