"use client";

import { formatTurmaHorarioChip, formatTurmaHorarioLegivel } from "@/lib/simulador/turma-course-utils";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { ScheduleSlot } from "@/lib/types/schedule";
import { bindEnrollmentCourseDragHandlers } from "@/lib/simulador/enrollment-course-drag-handlers";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentCourseSlotChipProps {
  course: TurmaOfertadaCourse;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selected: boolean;
  conflictHighlight?: boolean;
  onSelect: (course: TurmaOfertadaCourse) => void;
  onDragStart?: (turmaSigaaId: string) => void;
  onDragEnd?: () => void;
}

export function EnrollmentCourseSlotChip({
  course,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selected,
  conflictHighlight = false,
  onSelect,
  onDragStart,
  onDragEnd,
}: EnrollmentCourseSlotChipProps) {
  const state = resolveEnrollmentCourseSelectability(
    course,
    catalog,
    schedule,
    placementContext,
    corequisitoObligation
  );
  const horarioLabel = formatTurmaHorarioChip(course) ?? "Sem horário";
  const horarioTooltip = formatTurmaHorarioLegivel(course) ?? horarioLabel;
  const canDrag = state.selectable && !state.timeLocked && !state.schedulePlaced;
  const dragHandlers = bindEnrollmentCourseDragHandlers({
    turmaSigaaId: course.turmaSigaaId,
    draggable: canDrag,
    onDragStart,
    onDragEnd,
  });

  return (
    <button
      type="button"
      disabled={!state.selectable && !state.timeLocked}
      {...dragHandlers}
      className={[
        "enrollment-course-slot-chip",
        course.scheduleBlocker ? "is-blocked" : "",
        state.timeLocked ? "is-locked" : "",
        state.coreqLockHighlight ? "coreq-lock-highlight" : "",
        state.schedulePlaced ? "is-placed" : "",
        conflictHighlight ? "schedule-choque-highlight" : "",
        canDrag ? "enrollment-course--draggable" : "",
        selected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(course)}
      aria-pressed={selected}
      aria-label={`${course.name}, ${horarioTooltip}`}
      title={horarioTooltip}
    >
      <span className="enrollment-course-slot-chip-time">{horarioLabel}</span>
    </button>
  );
}
