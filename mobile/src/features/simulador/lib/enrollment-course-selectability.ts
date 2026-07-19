import {
  buildCorequisitoClusterBlockMessage,
  isCorequisitoClusterPlacementViable,
  isCorequisitoPartnerSelection,
  isMutualCorequisitoPartnerScheduleLocked,
  type CorequisitoObligation,
} from "./corequisito-cluster-viability";
import {
  ENROLLMENT_COREQUISITO_ACTIVE_PREFIX,
  ENROLLMENT_COREQUISITO_AFTER_HINT_PREFIX,
  ENROLLMENT_SCHEDULE_PLACED_HINT,
} from "./enrollment-ui-messages";
import type { SimuladorPlacementContext } from "./corequisito-schedule-policy";
import {
  formatDisciplinaCodeNames,
  isTurmaSelectable,
} from "./turma-course-utils";
import {
  getMissingCorequisitesForCourse,
  isTurmaPlacedOnSchedule,
  isTurmaScheduleLocked,
  isVariantBlockedBySibling,
  TURMA_EXCLUSIVE_VARIANT_MESSAGE,
  TURMA_COREQUISITO_PARTNER_CONFLICT_MESSAGE,
  TURMA_SCHEDULE_CONFLICT_MESSAGE,
} from "./turma-schedule-placement";
import { resolveCourseCoreqLockHighlight } from "./enrollment-schedule-highlights";
import type { ScheduleSlot } from "../types";
import {
  TURMA_PREREQ_CONDITIONAL_MESSAGE,
  type TurmaOfertadaCourse,
} from "../types";

export interface EnrollmentCourseSelectability {
  selectable: boolean;
  schedulePlaced: boolean;
  siblingBlocked: boolean;
  timeLocked: boolean;
  coreqLockHighlight: boolean;
  blockedByObligation: boolean;
  tooltip: string;
}

function buildPrerequisiteHint(
  course: TurmaOfertadaCourse,
  catalog: TurmaOfertadaCourse[],
  placementContext: SimuladorPlacementContext
): string | undefined {
  if (course.status !== "conditional") return undefined;

  const pending = course.pendingPrereqCodes.filter(Boolean);
  if (pending.length === 0) return TURMA_PREREQ_CONDITIONAL_MESSAGE;

  const pendingNames = formatDisciplinaCodeNames(
    pending,
    catalog,
    placementContext.disciplinaNames
  );
  return `${TURMA_PREREQ_CONDITIONAL_MESSAGE} Pendências: ${pendingNames}.`;
}

export function resolveEnrollmentCourseSelectability(
  course: TurmaOfertadaCourse,
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  placementContext: SimuladorPlacementContext,
  corequisitoObligation: CorequisitoObligation | null
): EnrollmentCourseSelectability {
  const schedulePlaced = isTurmaPlacedOnSchedule(course, schedule);
  const siblingBlocked = isVariantBlockedBySibling(course, schedule);
  const directTimeLocked = isTurmaScheduleLocked(course, schedule);
  const partnerTimeLocked =
    !directTimeLocked &&
    isMutualCorequisitoPartnerScheduleLocked(
      course,
      schedule,
      placementContext,
      catalog
    );
  const timeLocked = directTimeLocked || partnerTimeLocked;
  const coreqLockHighlight = resolveCourseCoreqLockHighlight(
    course,
    schedule,
    placementContext,
    catalog
  );
  const missingCoreqs = schedulePlaced
    ? []
    : getMissingCorequisitesForCourse(course, schedule, placementContext);
  const blockedByObligation = !isCorequisitoPartnerSelection(
    course,
    corequisitoObligation
  );
  const clusterWarning =
    !schedulePlaced &&
    !timeLocked &&
    !isCorequisitoClusterPlacementViable(
      course,
      schedule,
      placementContext,
      catalog
    );
  const activeCoreqs = course.coRequisitoCodes.filter(
    (code) => !course.waivedCoRequisitoCodes.includes(code)
  );
  const missingCoreqsNames = formatDisciplinaCodeNames(
    missingCoreqs,
    catalog,
    placementContext.disciplinaNames
  );
  const activeCoreqsNames = formatDisciplinaCodeNames(
    activeCoreqs,
    catalog,
    placementContext.disciplinaNames
  );
  const coreqHint =
    missingCoreqs.length > 0
      ? `${ENROLLMENT_COREQUISITO_AFTER_HINT_PREFIX} ${missingCoreqsNames}.`
      : clusterWarning
        ? buildCorequisitoClusterBlockMessage(course, placementContext, catalog)
        : activeCoreqs.length > 0 && !schedulePlaced
          ? `${ENROLLMENT_COREQUISITO_ACTIVE_PREFIX} ${activeCoreqsNames}.`
          : undefined;
  const selectable =
    isTurmaSelectable(course) &&
    !course.scheduleBlocker &&
    !blockedByObligation &&
    !timeLocked;
  const scheduleHint = schedulePlaced
    ? ENROLLMENT_SCHEDULE_PLACED_HINT
    : siblingBlocked
      ? TURMA_EXCLUSIVE_VARIANT_MESSAGE
      : directTimeLocked
        ? TURMA_SCHEDULE_CONFLICT_MESSAGE
        : partnerTimeLocked
          ? TURMA_COREQUISITO_PARTNER_CONFLICT_MESSAGE
          : undefined;
  const tooltip =
    scheduleHint ??
    coreqHint ??
    course.scheduleWarningMessage ??
    buildPrerequisiteHint(course, catalog, placementContext) ??
    course.name;

  return {
    selectable,
    schedulePlaced,
    siblingBlocked,
    timeLocked,
    coreqLockHighlight,
    blockedByObligation,
    tooltip,
  };
}

/**
 * Badge "Conflito" em cards multi-horário (×2, ×3, ×4…): só quando **todos**
 * os horários estão trancados, ou quando alguma variante depende de coreq parceiro.
 */
export function shouldShowGroupScheduleConflictBadge(
  variants: TurmaOfertadaCourse[],
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  placementContext: SimuladorPlacementContext
): boolean {
  if (variants.length <= 1) return false;

  for (const variant of variants) {
    if (
      isMutualCorequisitoPartnerScheduleLocked(
        variant,
        schedule,
        placementContext,
        catalog
      )
    ) {
      return true;
    }
  }

  return variants.every((variant) => isTurmaScheduleLocked(variant, schedule));
}
