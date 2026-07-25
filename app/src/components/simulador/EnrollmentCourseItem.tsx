"use client";

import { EnrollmentCourseStatusPill } from "@/components/simulador/EnrollmentCourseStatusPill";
import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import {
  ENROLLMENT_COREQUISITO_ACTIVE_PREFIX,
  ENROLLMENT_SCHEDULE_PLACED_HINT,
} from "@/lib/simulador/enrollment-ui-messages";
import {
  formatDisciplinaCodeNames,
  formatTurmaHorarioDisplay,
  formatTurmaHorarioLegivel,
  formatTurmaShortLabel,
} from "@/lib/simulador/turma-course-utils";
import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { ScheduleSlot } from "@/lib/types/schedule";
import { bindEnrollmentCourseDragHandlers } from "@/lib/simulador/enrollment-course-drag-handlers";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export interface EnrollmentCourseItemProps {
  course: TurmaOfertadaCourse;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selected: boolean;
  compact?: boolean;
  conflictHighlight?: boolean;
  onSelect: (course: TurmaOfertadaCourse) => void;
  onDragStart?: (turmaSigaaId: string) => void;
  onDragEnd?: () => void;
}

function buildActiveCorequisitoCodes(course: TurmaOfertadaCourse): string[] {
  const waived = new Set(course.waivedCoRequisitoCodes);
  return course.coRequisitoCodes.filter((code) => !waived.has(code));
}

export function EnrollmentCourseItem({
  course,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selected,
  compact = false,
  conflictHighlight = false,
  onSelect,
  onDragStart,
  onDragEnd,
}: EnrollmentCourseItemProps) {
  const state = resolveEnrollmentCourseSelectability(
    course,
    catalog,
    schedule,
    placementContext,
    corequisitoObligation
  );
  const activeCoreqs = buildActiveCorequisitoCodes(course);
  const hasCorequisitos = activeCoreqs.length > 0;
  const coreqTooltip = hasCorequisitos
    ? `${ENROLLMENT_COREQUISITO_ACTIVE_PREFIX} ${formatDisciplinaCodeNames(activeCoreqs, catalog, placementContext.disciplinaNames)}.`
    : undefined;
  const horarioLabel = formatTurmaHorarioDisplay(course);
  const horarioTooltip = formatTurmaHorarioLegivel(course);
  const shortBase = formatTurmaShortLabel(course);
  const isObrigatoria = course.categoria === "curso";
  const periodo = course.periodo ? `${course.periodo}º` : null;
  const shortLabel = isObrigatoria && periodo ? `${shortBase} | ${periodo}` : shortBase;
  const uncertainSchedule =
    Boolean(course.scheduleWarningMessage) && !course.scheduleBlocker;
  const conditionalPrereq = course.status === "conditional";
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
        "enrollment-course",
        "enrollment-course-btn",
        compact ? "enrollment-course-btn--compact" : "",
        course.status,
        course.scheduleBlocker ? "schedule-blocker" : "",
        state.timeLocked ? "schedule-locked" : "",
        state.blockedByObligation ? "schedule-obligation-blocked" : "",
        state.siblingBlocked ? "schedule-sibling-blocked" : "",
        state.schedulePlaced ? "schedule-placed" : "",
        uncertainSchedule ? "schedule-uncertain" : "",
        conditionalPrereq ? "prereq-conditional" : "",
        hasCorequisitos ? "has-corequisitos" : "",
        state.coreqLockHighlight ? "coreq-lock-highlight" : "",
        conflictHighlight ? "schedule-choque-highlight" : "",
        canDrag ? "enrollment-course--draggable" : "",
        selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(course)}
      aria-pressed={selected}
      aria-label={`${shortLabel}, ${course.name}`}
      title={course.name}
    >
      <span
        className="enrollment-course-accent"
        aria-hidden="true"
        style={{ backgroundColor: course.color }}
      />
      <div className="enrollment-course-body">
        {compact ? (
          <>
            <div className="enrollment-course-head">
              <SubjectApelido label={shortLabel} className="enrollment-course-compact-code" />
            </div>
            <p
              className="enrollment-course-card-foot"
              title={horarioTooltip ?? undefined}
            >
              {horarioLabel ?? "Sem horário"}
            </p>
          </>
        ) : (
          <>
            <div className="enrollment-course-head">
              <SubjectApelido label={shortLabel} />
              <div className="enrollment-course-badges">
                {course.scheduleBlocker ? (
                  <EnrollmentCourseStatusPill icon="lock" label="Sem horário" tone="danger" />
                ) : state.timeLocked ? (
                  <EnrollmentCourseStatusPill icon="lock" label="Conflito" tone="muted" />
                ) : state.siblingBlocked ? (
                  <EnrollmentCourseStatusPill icon="edit" label="Trocar" tone="gold" />
                ) : state.schedulePlaced ? (
                  <EnrollmentCourseStatusPill icon="check" label="Grade" tone="success" />
                ) : hasCorequisitos ? (
                  <span title={coreqTooltip}>
                    <EnrollmentCourseStatusPill icon="users" label="Coreq." tone="info" />
                  </span>
                ) : conditionalPrereq ? (
                  <EnrollmentCourseStatusPill icon="help-circle" label="Cond." tone="purple" />
                ) : uncertainSchedule ? (
                  <EnrollmentCourseStatusPill icon="help-circle" label="Prov." tone="gold" />
                ) : null}
              </div>
            </div>
            <p className="enrollment-course-card-title" title={course.name}>
              {course.name}
            </p>
            <p
              className="enrollment-course-card-foot"
              title={horarioTooltip ?? undefined}
            >
              {state.schedulePlaced
                ? ENROLLMENT_SCHEDULE_PLACED_HINT
                : horarioLabel ?? "\u00a0"}
            </p>
          </>
        )}
      </div>
    </button>
  );
}
