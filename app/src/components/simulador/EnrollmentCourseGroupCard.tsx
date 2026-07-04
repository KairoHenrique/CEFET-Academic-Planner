"use client";

import { useMemo } from "react";
import { EnrollmentCourseItem } from "@/components/simulador/EnrollmentCourseItem";
import { EnrollmentCourseSlotChip } from "@/components/simulador/EnrollmentCourseSlotChip";
import { EnrollmentCourseStatusPill } from "@/components/simulador/EnrollmentCourseStatusPill";
import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import type { EnrollmentCourseGroup } from "@/lib/simulador/group-enrollment-courses";
import {
  buildMultiHorarioBadgeLabel,
  buildMultiHorarioTooltip,
  ENROLLMENT_COREQUISITO_ACTIVE_PREFIX,
} from "@/lib/simulador/enrollment-ui-messages";
import {
  formatDisciplinaCodeNames,
  formatTurmaShortLabel,
} from "@/lib/simulador/turma-course-utils";
import { resolveEnrollmentCourseSelectability, shouldShowGroupScheduleConflictBadge } from "@/lib/simulador/enrollment-course-selectability";
import { isTurmaPlacedOnSchedule } from "@/lib/simulador/turma-schedule-placement";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentCourseGroupCardProps {
  group: EnrollmentCourseGroup;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  onSelect: (course: TurmaOfertadaCourse) => void;
}

function buildActiveCorequisitoCodes(course: TurmaOfertadaCourse): string[] {
  const waived = new Set(course.waivedCoRequisitoCodes);
  return course.coRequisitoCodes.filter((code) => !waived.has(code));
}

export function EnrollmentCourseGroupCard({
  group,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  onSelect,
}: EnrollmentCourseGroupCardProps) {
  const placedVariant = useMemo(
    () => group.variants.find((variant) => isTurmaPlacedOnSchedule(variant, schedule)),
    [group.variants, schedule]
  );
  const primaryVariant = group.variants[0];
  const activeCoreqs = primaryVariant
    ? buildActiveCorequisitoCodes(primaryVariant)
    : [];
  const hasCorequisitos = activeCoreqs.length > 0;
  const coreqTooltip = hasCorequisitos
    ? `${ENROLLMENT_COREQUISITO_ACTIVE_PREFIX} ${formatDisciplinaCodeNames(activeCoreqs, catalog, placementContext.disciplinaNames)}.`
    : undefined;
  const multiHorarioTooltip = buildMultiHorarioTooltip(group.variants.length);
  const groupShortLabel = formatTurmaShortLabel({
    code: group.code,
    name: group.name,
  });
  const groupLockState = primaryVariant
    ? resolveEnrollmentCourseSelectability(
        primaryVariant,
        catalog,
        schedule,
        placementContext,
        corequisitoObligation
      )
    : null;
  const showGroupConflictBadge = shouldShowGroupScheduleConflictBadge(
    group.variants,
    catalog,
    schedule,
    placementContext
  );

  if (!group.multiVariant) {
    const course = group.variants[0];
    if (!course) return null;

    return (
      <li className="enrollment-course-list-item">
        <EnrollmentCourseItem
          course={course}
          catalog={catalog}
          schedule={schedule}
          placementContext={placementContext}
          corequisitoObligation={corequisitoObligation}
          selected={selectedTurmaId === course.turmaSigaaId}
          onSelect={onSelect}
        />
      </li>
    );
  }

  return (
    <li
      className={[
        "enrollment-course-group",
        "enrollment-course-group--picker",
        selectedTurmaId && group.variants.some((v) => v.turmaSigaaId === selectedTurmaId)
          ? "is-active"
          : "",
        placedVariant ? "is-placed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "enrollment-course-group-card",
          groupLockState?.coreqLockHighlight ? "coreq-lock-highlight" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        title={group.name}
      >
        <span
          className="enrollment-course-accent"
          aria-hidden="true"
          style={{ backgroundColor: group.color }}
        />
        <div className="enrollment-course-group-body">
          <div className="enrollment-course-head">
            <SubjectApelido label={groupShortLabel} />
            <div className="enrollment-course-badges">
              {showGroupConflictBadge ? (
                <span title={groupLockState?.tooltip}>
                  <EnrollmentCourseStatusPill
                    icon="lock"
                    label="Conflito"
                    tone="muted"
                  />
                </span>
              ) : null}
              <span title={multiHorarioTooltip}>
                <EnrollmentCourseStatusPill
                  icon="calendar"
                  label={buildMultiHorarioBadgeLabel(group.variants.length)}
                  tone="info"
                />
              </span>
              {hasCorequisitos && !showGroupConflictBadge ? (
                <span title={coreqTooltip}>
                  <EnrollmentCourseStatusPill icon="users" label="Coreq." tone="info" />
                </span>
              ) : null}
            </div>
          </div>
          <p className="enrollment-course-card-title" title={group.name}>
            {group.name}
          </p>
          <div
            className="enrollment-course-slots"
            role="group"
            aria-label={`Horários de ${group.name}`}
          >
            {group.variants.map((variant) => (
              <EnrollmentCourseSlotChip
                key={variant.turmaSigaaId}
                course={variant}
                catalog={catalog}
                schedule={schedule}
                placementContext={placementContext}
                corequisitoObligation={corequisitoObligation}
                selected={selectedTurmaId === variant.turmaSigaaId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
