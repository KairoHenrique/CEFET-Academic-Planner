"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  ExpandableStage,
  ExpandToggleButton,
} from "@/components/ui/ExpandableStage";
import { Modal } from "@/components/ui/Modal";
import { ScheduleDetailContent } from "@/components/ui/ActivityDetail";
import { EnrollmentConflictNotice } from "@/components/simulador/EnrollmentConflictNotice";
import { EnrollmentCorequisitoRollbackDialog } from "@/components/simulador/EnrollmentCorequisitoRollbackDialog";
import { EnrollmentSelectionFloat } from "@/components/simulador/EnrollmentSelectionFloat";
import { EnrollmentSchedulePanel } from "@/components/simulador/EnrollmentSchedulePanel";
import { EnrollmentSidebar } from "@/components/simulador/EnrollmentSidebar";
import { useSimuladorChoques } from "@/hooks/useSimuladorChoques";
import { useSimuladorSimulacoes } from "@/hooks/useSimuladorSimulacoes";
import { buildScheduleFromTurmaIds } from "@/lib/simulador/build-schedule-from-simulation";
import {
  buildTurmaShortLabelRegistry,
  filterSimuladorTurmas,
  formatTurmaHorarioDisplay,
  formatTurmaShortLabel,
  isTurmaSelectable,
} from "@/lib/simulador/turma-course-utils";
import { buildSimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import {
  isCorequisitoPartnerSelection,
  resolveActiveCorequisitoObligation,
  resolveIncompleteCorequisitoPlacedHalf,
  resolveMutualCorequisitoPartnerOnSchedule,
  resolvePendingCorequisitoPartners,
  rollbackIncompleteCorequisitoPlacement,
  wouldRollbackIncompleteCorequisitoPlacement,
} from "@/lib/simulador/corequisito-cluster-viability";
import { summarizePlacedSchedule } from "@/lib/simulador/enrollment-schedule-stats";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import {
  buildMultiVariantPreviewMap,
  listPreviewCellColors,
  resolvePreviewCourseAtCell,
  resolvePreviewSegmentIndex,
} from "@/lib/simulador/enrollment-multi-variant-preview";
import {
  resolveEnrollmentScheduleConflictNotice,
  type EnrollmentScheduleConflictNotice,
} from "@/lib/simulador/enrollment-schedule-conflict-notice";
import { scrollEnrollmentScheduleIntoView } from "@/lib/simulador/scroll-enrollment-schedule-into-view";
import type { EnrollmentCourseGroup } from "@/lib/simulador/group-enrollment-courses";
import { buildEnrollmentGroupFromVariants } from "@/lib/simulador/group-enrollment-courses";
import {
  buildAllowedEmptyCellKeys,
  canPlaceTurmaOnSchedule,
  filterTurmasNotOnSchedule,
  isAllowedPlacementCell,
  placeTurmaOnSchedule,
  removeTurmaFromSchedule,
  scheduleCellKey,
} from "@/lib/simulador/turma-schedule-placement";
import {
  createEmptySchedule,
  type ScheduleSlot,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import type { TurmaOfertadaCourse, TurmasOfertadasResponse } from "@/lib/types/turmas-ofertadas-api";

import type { TurmaSelecionadaItem } from "@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas";

export const LOAD_TURMAS_SELECIONADAS_EVENT = "simulador:load-turmas-selecionadas";

interface EnrollmentSimulatorProps {
  data: TurmasOfertadasResponse;
}

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
  const partners = resolvePendingCorequisitoPartners(
    course,
    next,
    placementContext,
    visibleCourses
  );

  return { next, partners };
}

export function EnrollmentSimulator({ data }: EnrollmentSimulatorProps) {
  const visible = useMemo(() => filterSimuladorTurmas(data), [data]);
  const shortLabelRegistry = useMemo(
    () => buildTurmaShortLabelRegistry(visible.courses),
    [visible.courses]
  );
  const placementContext = useMemo(
    () => buildSimuladorPlacementContext(data.enrollmentContext),
    [data.enrollmentContext]
  );

  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleSlot[][]>(() =>
    createEmptySchedule()
  );
  const [selectedCourse, setSelectedCourse] = useState<TurmaOfertadaCourse | null>(
    null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupVariants, setSelectedGroupVariants] = useState<
    TurmaOfertadaCourse[]
  >([]);
  const [conflictNotice, setConflictNotice] =
    useState<EnrollmentScheduleConflictNotice | null>(null);
  const [conflictNoticeEpoch, setConflictNoticeEpoch] = useState(0);
  const [detail, setDetail] = useState<{
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  } | null>(null);
  const [corequisitoRollbackPrompt, setCorequisitoRollbackPrompt] =
    useState<CorequisitoRollbackPrompt | null>(null);
  const [draggedTurmaId, setDraggedTurmaId] = useState<string | null>(null);

  const scheduleStats = useMemo(
    () => summarizePlacedSchedule(schedule, visible.courses),
    [schedule, visible.courses]
  );

  const {
    hasConflicts,
    conflicts,
    conflictCellKeys,
    conflictTurmaIds,
    checking: checkingConflicts,
  } = useSimuladorChoques(scheduleStats.placedTurmaIds);

  const {
    items: savedSimulations,
    loading: savedSimulationsLoading,
    saving: savingSimulation,
    deleting: deletingSimulation,
    saveSimulation,
    deleteSimulation,
    loadSimulation,
  } = useSimuladorSimulacoes();

  const corequisitoObligation = useMemo(
    () => resolveActiveCorequisitoObligation(schedule, placementContext),
    [schedule, placementContext]
  );

  const multiVariantPreview = useMemo(() => {
    if (!selectedGroupId || selectedGroupVariants.length === 0) return null;

    return buildMultiVariantPreviewMap(
      selectedGroupVariants,
      visible.courses,
      schedule,
      placementContext,
      corequisitoObligation
    );
  }, [
    selectedGroupId,
    selectedGroupVariants,
    visible.courses,
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
    if (!selectedCourse) return null;
    return resolveEnrollmentCourseSelectability(
      selectedCourse,
      visible.courses,
      schedule,
      placementContext,
      corequisitoObligation
    );
  }, [
    selectedCourse,
    visible.courses,
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
      canPlaceSelectedCourse ||
      draggedTurmaId
  );

  const draggedCourse = useMemo(() => {
    if (!draggedTurmaId) return null;
    return visible.courses.find((course) => course.turmaSigaaId === draggedTurmaId) ?? null;
  }, [draggedTurmaId, visible.courses]);

  const dragAllowedCells = useMemo(() => {
    if (!draggedCourse) return null;
    return buildAllowedEmptyCellKeys(draggedCourse);
  }, [draggedCourse]);

  const availableCurso = useMemo(
    () => filterTurmasNotOnSchedule(visible.curso, schedule),
    [visible.curso, schedule]
  );

  const availableOptativas = useMemo(
    () => filterTurmasNotOnSchedule(visible.optativas, schedule),
    [visible.optativas, schedule]
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

  /** Após alocar metade do co-req: se o parceiro tem N turmas, mostra todas na grade. */
  const selectPendingCorequisitoPartners = useCallback(
    (partners: TurmaOfertadaCourse[]) => {
      if (partners.length > 1) {
        const group = buildEnrollmentGroupFromVariants(partners);
        // Mantém `selectedCourse` (1ª variante) para o card ALOCANDO — antes
        // ficava null e o float sumia no segundo passo do corequisito.
        setSelectedCourse(group.variants[0] ?? null);
        setSelectedGroupId(group.id);
        setSelectedGroupVariants(group.variants);
        scrollEnrollmentScheduleIntoView();
        return;
      }

      clearGroupPreview();
      setSelectedCourse(partners[0] ?? null);
    },
    [clearGroupPreview]
  );

  const showConflictForCourse = useCallback(
    (course: TurmaOfertadaCourse) => {
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
      scrollEnrollmentScheduleIntoView();
    },
    [visible.courses, schedule, placementContext, clearGroupPreview]
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

    if (!corequisitoObligation || !selectedCourse) return;

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
    visible.courses,
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
      if (!turmaSigaaId) return;

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
    [placementContext, removeTurmaImmediate, schedule, visible.courses]
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

  const handleEmptyClick = (
    dayIdx: number,
    slotIdx: number,
    clickMeta?: { clickOffsetX: number; elementWidth: number }
  ) => {
    if (multiVariantPreview && multiVariantPreview.size > 0) {
      const options =
        multiVariantPreview.get(scheduleCellKey(dayIdx, slotIdx)) ?? [];
      const segmentIndex = clickMeta
        ? resolvePreviewSegmentIndex(
            options.length,
            clickMeta.clickOffsetX,
            clickMeta.elementWidth
          )
        : 0;
      const course = resolvePreviewCourseAtCell(
        multiVariantPreview,
        dayIdx,
        slotIdx,
        segmentIndex
      );
      if (!course) return;
      if (!canPlaceTurmaOnSchedule(course, schedule, placementContext)) return;

      const { next, partners } = placeCourseOnSchedule(
        course,
        schedule,
        placementContext,
        visible.courses
      );

      setSchedule(next);
      selectPendingCorequisitoPartners(partners);
      setConflictNotice(null);
      return;
    }

    if (!selectedCourse) return;
    if (!isAllowedPlacementCell(selectedCourse, dayIdx, slotIdx)) return;
    if (!canPlaceTurmaOnSchedule(selectedCourse, schedule, placementContext)) {
      return;
    }

    const { next, partners } = placeCourseOnSchedule(
      selectedCourse,
      schedule,
      placementContext,
      visible.courses
    );

    setSchedule(next);
    selectPendingCorequisitoPartners(partners);
  };

  const handleSlotClick = (payload: {
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  }) => {
    setDetail(payload);
  };

  const handleCourseClick = (course: TurmaOfertadaCourse) => {
    if (!isTurmaSelectable(course)) return;

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

    if (!isCorequisitoPartnerSelection(course, corequisitoObligation)) return;

    const isDeselect = selectedCourse?.turmaSigaaId === course.turmaSigaaId;

    if (isDeselect) {
      requestCancelSelectedCourse();
      return;
    }

    setSelectedCourse(course);
    setConflictNotice(null);
    scrollEnrollmentScheduleIntoView();
  };

  const handleGroupClick = (group: EnrollmentCourseGroup) => {
    if (!group.multiVariant) return;

    const isDeselect = selectedGroupId === group.id;

    if (isDeselect) {
      clearGroupPreview();
      setSelectedCourse(null);
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

    // Representante p/ card ALOCANDO; a grade continua com preview multi-variante.
    setSelectedCourse(placeable[0] ?? null);
    setSelectedGroupId(group.id);
    setSelectedGroupVariants(group.variants);
    setConflictNotice(null);
    scrollEnrollmentScheduleIntoView();
  };

  const handleClearSchedule = () => {
    setSchedule(createEmptySchedule());
    setSelectedCourse(null);
    clearGroupPreview();
    setConflictNotice(null);
    setDetail(null);
    setCorequisitoRollbackPrompt(null);
    setDraggedTurmaId(null);
  };

  const placeCourseAtCell = useCallback(
    (course: TurmaOfertadaCourse, dayIdx: number, slotIdx: number) => {
      if (!isAllowedPlacementCell(course, dayIdx, slotIdx)) return false;
      if (!canPlaceTurmaOnSchedule(course, schedule, placementContext)) {
        showConflictForCourse(course);
        return false;
      }

      const { next, partners } = placeCourseOnSchedule(
        course,
        schedule,
        placementContext,
        visible.courses
      );

      setSchedule(next);
      selectPendingCorequisitoPartners(partners);
      setConflictNotice(null);
      return true;
    },
    [
      schedule,
      placementContext,
      visible.courses,
      selectPendingCorequisitoPartners,
      showConflictForCourse,
    ]
  );

  const handleCourseDrop = useCallback(
    (turmaSigaaId: string, dayIdx: number, slotIdx: number) => {
      const course = visible.courses.find(
        (item) => item.turmaSigaaId === turmaSigaaId
      );
      if (!course || !isTurmaSelectable(course)) return;

      setSelectedCourse(course);
      placeCourseAtCell(course, dayIdx, slotIdx);
      setDraggedTurmaId(null);
    },
    [visible.courses, placeCourseAtCell]
  );

  const handleSaveSimulation = useCallback(
    async (titulo: string) => {
      await saveSimulation({
        titulo,
        turmaSigaaIds: scheduleStats.placedTurmaIds,
        semestre: data.semestre,
      });
    },
    [data.semestre, saveSimulation, scheduleStats.placedTurmaIds]
  );

  const handleLoadSimulation = useCallback(
    async (id: string) => {
      const simulation = await loadSimulation(id);
      const nextSchedule = buildScheduleFromTurmaIds(
        simulation.payload.turmaSigaaIds,
        visible.courses,
        placementContext
      );

      setSchedule(nextSchedule);
      setSelectedCourse(null);
      clearGroupPreview();
      setConflictNotice(null);
      setDetail(null);
      setCorequisitoRollbackPrompt(null);
      setDraggedTurmaId(null);
    },
    [clearGroupPreview, loadSimulation, placementContext, visible.courses]
  );

  useEffect(() => {
    const handleLoadTurmas = (e: Event) => {
      const customEvent = e as CustomEvent<{ turmas: TurmaSelecionadaItem[] }>;
      const turmas = customEvent.detail?.turmas;
      if (!turmas || !Array.isArray(turmas)) return;

      const turmaSigaaIds = turmas
        .map((t) => {
          const matching = visible.courses.find(
            (c) =>
              c.sigaaComponente === t.codigoDisciplina &&
              (!t.turmaCodigo || c.sigaaTurma === t.turmaCodigo)
          );
          return matching?.turmaSigaaId;
        })
        .filter(Boolean) as string[];

      const nextSchedule = buildScheduleFromTurmaIds(
        turmaSigaaIds,
        visible.courses,
        placementContext
      );
      setSchedule(nextSchedule);
      setSelectedCourse(null);
      clearGroupPreview();
      setConflictNotice(null);
      setDetail(null);
      setCorequisitoRollbackPrompt(null);
      setDraggedTurmaId(null);
    };

    window.addEventListener(LOAD_TURMAS_SELECIONADAS_EVENT, handleLoadTurmas);
    return () => window.removeEventListener(LOAD_TURMAS_SELECIONADAS_EVENT, handleLoadTurmas);
  }, [clearGroupPreview, placementContext, visible.courses]);

  return (
    <>
      <ExpandableStage
        expanded={expanded}
        onCollapse={() => setExpanded(false)}
        title="Simulador de Matrícula"
      >
      <div className="enrollment-stage" data-expanded={expanded || undefined}>
      <div className="expandable-head">
        <SectionHeader title="Simulador de Matrícula" icon="map" />
        <ExpandToggleButton
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          label="grade"
        />
      </div>

      <div className="enrollment-layout">
        <div className="enrollment-schedule-stack">
          {selectedCourse && selectedShortLabel && canPlaceSelectedCourse ? (
            <EnrollmentSelectionFloat
              selectedCourse={selectedCourse}
              selectedShortLabel={selectedShortLabel}
              selectedHorario={
                selectedGroupId && selectedGroupVariants.length > 1
                  ? "Várias turmas — clique em uma célula destacada na grade"
                  : selectedHorario
              }
              onDismiss={requestCancelSelectedCourse}
            />
          ) : null}

          <EnrollmentSchedulePanel
            schedule={schedule}
            catalog={visible.courses}
            placedCount={scheduleStats.placedCount}
            obrigatoriasCh={scheduleStats.obrigatoriasCh}
            optativasCh={scheduleStats.optativasCh}
            totalCh={scheduleStats.totalCh}
            semestreLabel={data.semestre}
            highlightEmpty={highlightEmpty}
            allowedEmptyCells={allowedEmptyCells}
            dragAllowedCells={dragAllowedCells}
            conflictCellKeys={hasConflicts ? conflictCellKeys : undefined}
            conflicts={conflicts}
            checkingConflicts={checkingConflicts}
            previewCellLayers={previewCellLayers}
            savedSimulations={savedSimulations}
            savedSimulationsLoading={savedSimulationsLoading}
            savingSimulation={savingSimulation}
            deletingSimulation={deletingSimulation}
            onSlotClick={handleSlotClick}
            onEmptyClick={handleEmptyClick}
            onCourseDrop={handleCourseDrop}
            onClearSchedule={handleClearSchedule}
            onSaveSimulation={handleSaveSimulation}
            onLoadSimulation={(id) => void handleLoadSimulation(id)}
            onDeleteSimulation={(id) => void handleDeleteSimulation(id)}
          />
        </div>

        <EnrollmentSidebar
          curso={availableCurso}
          optativas={availableOptativas}
          catalog={visible.courses}
          schedule={schedule}
          placementContext={placementContext}
          corequisitoObligation={corequisitoObligation}
          selectedTurmaId={selectedCourse?.turmaSigaaId ?? null}
          selectedGroupId={selectedGroupId}
          conflictTurmaIds={hasConflicts ? conflictTurmaIds : undefined}
          onSelect={handleCourseClick}
          onSelectGroup={handleGroupClick}
          onCourseDragStart={setDraggedTurmaId}
          onCourseDragEnd={() => setDraggedTurmaId(null)}
        />
      </div>
      </div>
      </ExpandableStage>

      {conflictNotice ? (
        <EnrollmentConflictNotice
          key={conflictNoticeEpoch}
          notice={conflictNotice}
          onDismiss={() => setConflictNotice(null)}
        />
      ) : null}

      {corequisitoRollbackPrompt ? (
        <EnrollmentCorequisitoRollbackDialog
          open
          mode={corequisitoRollbackPrompt.mode}
          primary={{
            shortLabel: formatTurmaShortLabel(
              corequisitoRollbackPrompt.primary,
              shortLabelRegistry
            ),
            name: corequisitoRollbackPrompt.primary.name,
          }}
          partner={{
            shortLabel: formatTurmaShortLabel(
              corequisitoRollbackPrompt.partner,
              shortLabelRegistry
            ),
            name: corequisitoRollbackPrompt.partner.name,
          }}
          onConfirm={confirmCorequisitoRollback}
          onCancel={() => setCorequisitoRollbackPrompt(null)}
        />
      ) : null}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={
          detail?.slot.displayName ??
          detail?.slot.courseName ??
          detail?.slot.name ??
          "Atividade"
        }
      >
        {detail ? (
          <ScheduleDetailContent
            slot={detail.slot}
            day={detail.day}
            time={detail.time}
            simulated
            onClose={() => setDetail(null)}
            onRemove={() => requestRemoveTurma(detail.slot.turmaSigaaId)}
          />
        ) : null}
      </Modal>
    </>
  );
}
