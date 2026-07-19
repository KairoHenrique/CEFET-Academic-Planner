/**
 * Barrel de compatibilidade — reexporta a orquestração 1:1 do site.
 * Preferir imports diretos dos módulos em `lib/` em código novo.
 */

export {
  areExclusiveEnrollmentVariants,
  groupEnrollmentCourses,
  type EnrollmentCourseGroup,
} from "./group-enrollment-courses";

export {
  formatTurmaShortLabel,
  formatTurmaHorarioDisplay,
  formatTurmaHorarioLegivel,
  formatTurmasSyncedAt,
  filterSimuladorTurmas,
  turmaToSlotData,
  buildTurmaShortLabelRegistry,
  formatDisciplinaCodeNames,
  isTurmaSelectable,
} from "./turma-course-utils";

export {
  buildAllowedEmptyCellKeys,
  canPlaceTurmaOnSchedule,
  placeTurmaOnSchedule,
  removeTurmaFromSchedule,
  isTurmaPlacedOnSchedule,
  isDisciplinaPlacedOnSchedule,
  filterTurmasNotOnSchedule,
  getTurmaAllowedPositions,
  scheduleCellKey,
} from "./turma-schedule-placement";

export { summarizePlacedSchedule } from "./enrollment-schedule-stats";
export { buildScheduleFromTurmaIds } from "./build-schedule-from-simulation";

/** @deprecated use `groupEnrollmentCourses` */
export { groupEnrollmentCourses as groupByCode } from "./group-enrollment-courses";
