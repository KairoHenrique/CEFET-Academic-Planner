import { useCallback, useMemo, useState } from "react";
import type {
  ScheduleSlot,
  ScheduleSlotData,
  TurmaOfertadaCourse,
  TurmasOfertadasResponse,
} from "./types";
import { createEmptySchedule, scheduleCellKey } from "./types";
import { buildScheduleFromTurmaIds } from "./lib/build-schedule-from-simulation";
import {
  buildSimuladorPlacementContext,
} from "./lib/corequisito-schedule-policy";
import {
  isCorequisitoPartnerSelection,
  resolveActiveCorequisitoObligation,
  resolveIncompleteCorequisitoPlacedHalf,
  resolveMutualCorequisitoPartnerOnSchedule,
  resolvePendingCorequisitoPartner,
  rollbackIncompleteCorequisitoPlacement,
  wouldRollbackIncompleteCorequisitoPlacement,
} from "./lib/corequisito-cluster-viability";
import { summarizePlacedSchedule } from "./lib/enrollment-schedule-stats";
import { resolveEnrollmentCourseSelectability } from "./lib/enrollment-course-selectability";
import {
  buildMultiVariantPreviewMap,
  listPreviewCellColors,
  resolvePreviewCourseAtCell,
} from "./lib/enrollment-multi-variant-preview";
import {
  resolveEnrollmentScheduleConflictNotice,
  type EnrollmentScheduleConflictNotice,
} from "./lib/enrollment-schedule-conflict-notice";
import type { EnrollmentCourseGroup } from "./lib/group-enrollment-courses";
import {
  buildAllowedEmptyCellKeys,
  canPlaceTurmaOnSchedule,
  filterTurmasNotOnSchedule,
  isAllowedPlacementCell,
  placeTurmaOnSchedule,
  removeTurmaFromSchedule,
} from "./lib/turma-schedule-placement";
import {
  buildTurmaShortLabelRegistry,
  filterSimuladorTurmas,
  formatTurmaHorarioDisplay,
  formatTurmaShortLabel,
  isTurmaSelectable,
} from "./lib/turma-course-utils";

interface CorequisitoRollbackPrompt {
  mode: "cancel" | "remove";
  primary: TurmaOfertadaCourse;
  partner: TurmaOfertadaCourse;
  removeTurmaId?: string;
}

function placeCourseOnSchedule(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  placementContext: ReturnType<typeof buildSimuladorPlacementContext>,
  visibleCourses: TurmaOfertadaCourse[]
) {
  const next = placeTurmaOnSchedule(course, schedule, placementContext);
  const partner = resolvePendingCorequisitoPartner(
    course,
    next,
    placementContext,
    visibleCourses
  );
  return { next, partner };
}

export type EnrollmentDetailState = {
  slot: ScheduleSlotData;
  day: string;
  time: string;
  dayIdx: number;
  slotIdx: number;
} | null;

/**
 * Orquestração 1:1 de `EnrollmentSimulator` (site) — sem drag-and-drop web.
 */
export function useEnrollmentSimulator(
  data: TurmasOfertadasResponse | null,
  options?: { onScrollToSchedule?: () => void }
) {
  const onScrollToSchedule = options?.onScrollToSchedule;

  const visible = useMemo(
    () => (data ? filterSimuladorTurmas(data) : null),
    [data]
  );

  const shortLabelRegistry = useMemo(
    () => buildTurmaShortLabelRegistry(visible?.courses ?? []),
    [visible?.courses]
  );

  const placementContext = useMemo(
    () =>
      buildSimuladorPlacementContext(
        data?.enrollmentContext ?? {
          completedDisciplinaCodes: [],
          coRequisitos: {},
          disciplinaNames: {},
        }
      ),
    [data?.enrollmentContext]
  );

  const [schedule, setSchedule] = useState<ScheduleSlot[][]>(() =>
    createEmptySchedule()
  );
  const [selectedCourse, setSelectedCourse] =
    useState<TurmaOfertadaCourse | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupVariants, setSelectedGroupVariants] = useState<
    TurmaOfertadaCourse[]
  >([]);
  const [conflictNotice, setConflictNotice] =
    useState<EnrollmentScheduleConflictNotice | null>(null);
  const [conflictNoticeEpoch, setConflictNoticeEpoch] = useState(0);
  const [detail, setDetail] = useState<EnrollmentDetailState>(null);
  const [corequisitoRollbackPrompt, setCorequisitoRollbackPrompt] =
    useState<CorequisitoRollbackPrompt | null>(null);

  const scheduleStats = useMemo(
    () => summarizePlacedSchedule(schedule, visible?.courses ?? []),
    [schedule, visible?.courses]
  );

  const corequisitoObligation = useMemo(
    () => resolveActiveCorequisitoObligation(schedule, placementContext),
    [schedule, placementContext]
  );

  const multiVariantPreview = useMemo(() => {
    if (!selectedGroupId || selectedGroupVariants.length === 0) return null;
    return buildMultiVariantPreviewMap(
      selectedGroupVariants,
      visible?.courses ?? [],
      schedule,
      placementContext,
      corequisitoObligation
    );
  }, [
    selectedGroupId,
    selectedGroupVariants,
    visible?.courses,
    schedule,
    placementContext,
    corequisitoObligation,
  ]);

  const previewCellLayers = useMemo(() => {
    if (!multiVariantPreview || multiVariantPreview.size === 0) return null;
    return new Map(
      [...multiVariantPreview.entries()].map(([key, options]) => [
        key,
        listPreviewCellColors(options),
      ])
    );
  }, [multiVariantPreview]);

  const selectedCourseState = useMemo(() => {
    if (!selectedCourse || !visible) return null;
    return resolveEnrollmentCourseSelectability(
      selectedCourse,
      visible.courses,
      schedule,
      placementContext,
      corequisitoObligation
    );
  }, [
    selectedCourse,
    visible,
    schedule,
    placementContext,
    corequisitoObligation,
  ]);

  const canPlaceSelectedCourse =
    Boolean(selectedCourse) &&
    Boolean(selectedCourseState) &&
    !selectedCourseState!.timeLocked &&
    !selectedCourseState!.blockedByObligation;

  const allowedEmptyCells = useMemo(() => {
    if (multiVariantPreview && multiVariantPreview.size > 0) {
      return new Set(multiVariantPreview.keys());
    }
    if (!selectedCourse || !canPlaceSelectedCourse) return null;
    return buildAllowedEmptyCellKeys(selectedCourse);
  }, [multiVariantPreview, selectedCourse, canPlaceSelectedCourse]);

  const highlightEmpty = Boolean(
    (multiVariantPreview && multiVariantPreview.size > 0) ||
      canPlaceSelectedCourse
  );

  const availableCurso = useMemo(
    () =>
      visible ? filterTurmasNotOnSchedule(visible.curso, schedule) : [],
    [visible, schedule]
  );

  const availableOptativas = useMemo(
    () =>
      visible ? filterTurmasNotOnSchedule(visible.optativas, schedule) : [],
    [visible, schedule]
  );

  const selectedShortLabel = selectedCourse
    ? formatTurmaShortLabel(selectedCourse, shortLabelRegistry)
    : null;

  const selectedHorario = selectedCourse
    ? formatTurmaHorarioDisplay(selectedCourse)
    : null;

  const clearGroupPreview = useCallback(() => {
    setSelectedGroupId(null);
    setSelectedGroupVariants([]);
  }, []);

  const showConflictForCourse = useCallback(
    (course: TurmaOfertadaCourse) => {
      if (!visible) return;
      const notice = resolveEnrollmentScheduleConflictNotice(
        course,
        visible.courses,
        schedule,
        placementContext
      );
      setSelectedCourse(course);
      clearGroupPreview();
      setConflictNotice(notice);
      setConflictNoticeEpoch((value) => value + 1);
      onScrollToSchedule?.();
    },
    [visible, schedule, placementContext, clearGroupPreview, onScrollToSchedule]
  );

  const cancelSelectedCourse = useCallback(() => {
    setSchedule((prev) =>
      rollbackIncompleteCorequisitoPlacement(
        prev,
        placementContext,
        corequisitoObligation,
        selectedCourse
      )
    );
    setSelectedCourse(null);
    setConflictNotice(null);
    setCorequisitoRollbackPrompt(null);
  }, [placementContext, corequisitoObligation, selectedCourse]);

  const requestCancelSelectedCourse = useCallback(() => {
    if (
      !wouldRollbackIncompleteCorequisitoPlacement(
        corequisitoObligation,
        selectedCourse
      )
    ) {
      cancelSelectedCourse();
      return;
    }

    if (!corequisitoObligation || !selectedCourse || !visible) return;

    const placedHalf = resolveIncompleteCorequisitoPlacedHalf(
      schedule,
      placementContext,
      corequisitoObligation
    );
    const primary = placedHalf
      ? visible.courses.find(
          (course) => course.turmaSigaaId === placedHalf.turmaSigaaId
        )
      : null;

    if (!primary) {
      cancelSelectedCourse();
      return;
    }

    setCorequisitoRollbackPrompt({
      mode: "cancel",
      primary,
      partner: selectedCourse,
    });
  }, [
    cancelSelectedCourse,
    corequisitoObligation,
    placementContext,
    schedule,
    selectedCourse,
    visible,
  ]);

  const removeTurmaImmediate = useCallback(
    (turmaSigaaId: string) => {
      setSchedule((prev) =>
        removeTurmaFromSchedule(turmaSigaaId, prev, placementContext)
      );
      setDetail(null);
      setSelectedCourse((prev) =>
        prev?.turmaSigaaId === turmaSigaaId ? null : prev
      );
      setCorequisitoRollbackPrompt(null);
    },
    [placementContext]
  );

  const requestRemoveTurma = useCallback(
    (turmaSigaaId: string | undefined) => {
      if (!turmaSigaaId || !visible) return;

      const course = visible.courses.find(
        (item) => item.turmaSigaaId === turmaSigaaId
      );
      if (!course) {
        removeTurmaImmediate(turmaSigaaId);
        return;
      }

      const partner = resolveMutualCorequisitoPartnerOnSchedule(
        turmaSigaaId,
        schedule,
        placementContext,
        visible.courses
      );

      if (!partner) {
        removeTurmaImmediate(turmaSigaaId);
        return;
      }

      setDetail(null);
      setCorequisitoRollbackPrompt({
        mode: "remove",
        primary: course,
        partner,
        removeTurmaId: turmaSigaaId,
      });
    },
    [placementContext, removeTurmaImmediate, schedule, visible]
  );

  const confirmCorequisitoRollback = useCallback(() => {
    if (!corequisitoRollbackPrompt) return;
    if (corequisitoRollbackPrompt.mode === "cancel") {
      cancelSelectedCourse();
      return;
    }
    if (corequisitoRollbackPrompt.removeTurmaId) {
      removeTurmaImmediate(corequisitoRollbackPrompt.removeTurmaId);
    }
  }, [cancelSelectedCourse, corequisitoRollbackPrompt, removeTurmaImmediate]);

  const handleEmptyClick = useCallback(
    (dayIdx: number, slotIdx: number) => {
      if (!visible) return;

      if (multiVariantPreview && multiVariantPreview.size > 0) {
        const course = resolvePreviewCourseAtCell(
          multiVariantPreview,
          dayIdx,
          slotIdx,
          0
        );
        if (!course) return;
        if (!canPlaceTurmaOnSchedule(course, schedule, placementContext)) {
          return;
        }

        const { next, partner } = placeCourseOnSchedule(
          course,
          schedule,
          placementContext,
          visible.courses
        );
        setSchedule(next);
        clearGroupPreview();
        setSelectedCourse(partner);
        setConflictNotice(null);
        return;
      }

      if (!selectedCourse) return;
      if (!isAllowedPlacementCell(selectedCourse, dayIdx, slotIdx)) return;
      if (
        !canPlaceTurmaOnSchedule(selectedCourse, schedule, placementContext)
      ) {
        return;
      }

      const { next, partner } = placeCourseOnSchedule(
        selectedCourse,
        schedule,
        placementContext,
        visible.courses
      );
      setSchedule(next);
      setSelectedCourse(partner);
    },
    [
      visible,
      multiVariantPreview,
      selectedCourse,
      schedule,
      placementContext,
      clearGroupPreview,
    ]
  );

  const handleCourseClick = useCallback(
    (course: TurmaOfertadaCourse) => {
      if (!visible || !isTurmaSelectable(course)) return;

      clearGroupPreview();

      const state = resolveEnrollmentCourseSelectability(
        course,
        visible.courses,
        schedule,
        placementContext,
        corequisitoObligation
      );

      if (state.timeLocked) {
        showConflictForCourse(course);
        return;
      }

      if (!isCorequisitoPartnerSelection(course, corequisitoObligation)) {
        return;
      }

      const isDeselect = selectedCourse?.turmaSigaaId === course.turmaSigaaId;
      if (isDeselect) {
        requestCancelSelectedCourse();
        return;
      }

      setSelectedCourse(course);
      setConflictNotice(null);
      onScrollToSchedule?.();
    },
    [
      visible,
      clearGroupPreview,
      schedule,
      placementContext,
      corequisitoObligation,
      showConflictForCourse,
      selectedCourse,
      requestCancelSelectedCourse,
      onScrollToSchedule,
    ]
  );

  const handleGroupClick = useCallback(
    (group: EnrollmentCourseGroup) => {
      if (!group.multiVariant || !visible) return;

      const isDeselect = selectedGroupId === group.id && !selectedCourse;
      if (isDeselect) {
        clearGroupPreview();
        setConflictNotice(null);
        return;
      }

      const placeable = group.variants.filter((variant) => {
        const state = resolveEnrollmentCourseSelectability(
          variant,
          visible.courses,
          schedule,
          placementContext,
          corequisitoObligation
        );
        return state.selectable && !state.timeLocked;
      });

      if (placeable.length === 0) {
        const primary = group.variants[0];
        if (primary) showConflictForCourse(primary);
        return;
      }

      setSelectedCourse(null);
      setSelectedGroupId(group.id);
      setSelectedGroupVariants(group.variants);
      setConflictNotice(null);
      onScrollToSchedule?.();
    },
    [
      visible,
      selectedGroupId,
      selectedCourse,
      clearGroupPreview,
      schedule,
      placementContext,
      corequisitoObligation,
      showConflictForCourse,
      onScrollToSchedule,
    ]
  );

  const handleClearSchedule = useCallback(() => {
    setSchedule(createEmptySchedule());
    setSelectedCourse(null);
    clearGroupPreview();
    setConflictNotice(null);
    setDetail(null);
    setCorequisitoRollbackPrompt(null);
  }, [clearGroupPreview]);

  const loadFromTurmaIds = useCallback(
    (turmaSigaaIds: readonly string[]) => {
      if (!visible) return;
      setSchedule(
        buildScheduleFromTurmaIds(
          turmaSigaaIds,
          visible.courses,
          placementContext
        )
      );
      setSelectedCourse(null);
      clearGroupPreview();
      setConflictNotice(null);
      setDetail(null);
      setCorequisitoRollbackPrompt(null);
    },
    [visible, placementContext, clearGroupPreview]
  );

  return {
    visible,
    shortLabelRegistry,
    placementContext,
    schedule,
    scheduleStats,
    selectedCourse,
    selectedGroupId,
    selectedShortLabel,
    selectedHorario,
    canPlaceSelectedCourse,
    allowedEmptyCells,
    highlightEmpty,
    previewCellLayers,
    availableCurso,
    availableOptativas,
    corequisitoObligation,
    conflictNotice,
    conflictNoticeEpoch,
    detail,
    setDetail,
    corequisitoRollbackPrompt,
    setCorequisitoRollbackPrompt,
    dismissConflictNotice: () => setConflictNotice(null),
    handleEmptyClick,
    handleCourseClick,
    handleGroupClick,
    handleClearSchedule,
    requestCancelSelectedCourse,
    requestRemoveTurma,
    confirmCorequisitoRollback,
    loadFromTurmaIds,
    formatShortLabel: (course: TurmaOfertadaCourse) =>
      formatTurmaShortLabel(course, shortLabelRegistry),
    scheduleCellKey,
  };
}
