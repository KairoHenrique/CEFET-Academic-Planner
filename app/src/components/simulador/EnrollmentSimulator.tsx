"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { ScheduleDetailContent } from "@/components/ui/ActivityDetail";
import { EnrollmentConflictNotice } from "@/components/simulador/EnrollmentConflictNotice";
import { EnrollmentSelectionFloat } from "@/components/simulador/EnrollmentSelectionFloat";
import { EnrollmentSchedulePanel } from "@/components/simulador/EnrollmentSchedulePanel";
import { EnrollmentSidebar } from "@/components/simulador/EnrollmentSidebar";
import {
  filterSimuladorTurmas,
  formatTurmaHorarioDisplay,
  formatTurmaShortLabel,
  isTurmaSelectable,
} from "@/lib/simulador/turma-course-utils";
import { buildSimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import {
  isCorequisitoPartnerSelection,
  resolveActiveCorequisitoObligation,
  resolvePendingCorequisitoPartner,
} from "@/lib/simulador/corequisito-cluster-viability";
import { summarizePlacedSchedule } from "@/lib/simulador/enrollment-schedule-stats";
import {
  ENROLLMENT_BLOCKING_FLASH_MS,
  resolveSelectedLockedCourseBlockingCellKeys,
} from "@/lib/simulador/enrollment-schedule-highlights";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import {
  resolveEnrollmentScheduleConflictNotice,
  type EnrollmentScheduleConflictNotice,
} from "@/lib/simulador/enrollment-schedule-conflict-notice";
import { scrollEnrollmentScheduleIntoView } from "@/lib/simulador/scroll-enrollment-schedule-into-view";
import {
  buildAllowedEmptyCellKeys,
  canPlaceTurmaOnSchedule,
  filterTurmasNotOnSchedule,
  isAllowedPlacementCell,
  placeTurmaOnSchedule,
  removeTurmaFromSchedule,
} from "@/lib/simulador/turma-schedule-placement";
import {
  createEmptySchedule,
  type ScheduleSlot,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import type { TurmaOfertadaCourse, TurmasOfertadasResponse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentSimulatorProps {
  data: TurmasOfertadasResponse;
}

export function EnrollmentSimulator({ data }: EnrollmentSimulatorProps) {
  const visible = useMemo(() => filterSimuladorTurmas(data), [data]);
  const placementContext = useMemo(
    () => buildSimuladorPlacementContext(data.enrollmentContext),
    [data.enrollmentContext]
  );

  const [schedule, setSchedule] = useState<ScheduleSlot[][]>(() =>
    createEmptySchedule()
  );
  const [selectedCourse, setSelectedCourse] = useState<TurmaOfertadaCourse | null>(
    null
  );
  const [conflictNotice, setConflictNotice] =
    useState<EnrollmentScheduleConflictNotice | null>(null);
  const [conflictNoticeEpoch, setConflictNoticeEpoch] = useState(0);
  const [blockingFlashCellKeys, setBlockingFlashCellKeys] =
    useState<ReadonlySet<string> | null>(null);
  const blockingFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [detail, setDetail] = useState<{
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  } | null>(null);

  const corequisitoObligation = useMemo(
    () => resolveActiveCorequisitoObligation(schedule, placementContext),
    [schedule, placementContext]
  );

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
    if (!selectedCourse || !canPlaceSelectedCourse) return null;
    return buildAllowedEmptyCellKeys(selectedCourse);
  }, [selectedCourse, canPlaceSelectedCourse]);

  const scheduleStats = useMemo(
    () => summarizePlacedSchedule(schedule),
    [schedule]
  );

  const clearBlockingFlash = useCallback(() => {
    if (blockingFlashTimerRef.current) {
      clearTimeout(blockingFlashTimerRef.current);
      blockingFlashTimerRef.current = null;
    }
    setBlockingFlashCellKeys(null);
  }, []);

  const triggerBlockingFlash = useCallback(
    (course: TurmaOfertadaCourse) => {
      const keys = resolveSelectedLockedCourseBlockingCellKeys(
        course,
        visible.courses,
        schedule,
        placementContext
      );
      if (keys.size === 0) return;

      if (blockingFlashTimerRef.current) {
        clearTimeout(blockingFlashTimerRef.current);
        blockingFlashTimerRef.current = null;
      }

      setBlockingFlashCellKeys(null);
      requestAnimationFrame(() => {
        setBlockingFlashCellKeys(new Set(keys));
        blockingFlashTimerRef.current = setTimeout(() => {
          setBlockingFlashCellKeys(null);
          blockingFlashTimerRef.current = null;
        }, ENROLLMENT_BLOCKING_FLASH_MS);
      });
    },
    [visible.courses, schedule, placementContext]
  );

  useEffect(() => () => clearBlockingFlash(), [clearBlockingFlash]);

  const availableCurso = useMemo(
    () => filterTurmasNotOnSchedule(visible.curso, schedule),
    [visible.curso, schedule]
  );

  const availableOptativas = useMemo(
    () => filterTurmasNotOnSchedule(visible.optativas, schedule),
    [visible.optativas, schedule]
  );

  const selectedShortLabel = selectedCourse
    ? formatTurmaShortLabel(selectedCourse, visible.courses)
    : null;

  const selectedHorario = selectedCourse
    ? formatTurmaHorarioDisplay(selectedCourse)
    : null;

  const removeTurma = (turmaSigaaId: string | undefined) => {
    if (!turmaSigaaId) return;
    setSchedule((prev) =>
      removeTurmaFromSchedule(turmaSigaaId, prev, placementContext)
    );
    setDetail(null);
    setSelectedCourse((prev) =>
      prev?.turmaSigaaId === turmaSigaaId ? null : prev
    );
  };

  const handleEmptyClick = (dayIdx: number, slotIdx: number) => {
    if (!selectedCourse) return;
    if (!isAllowedPlacementCell(selectedCourse, dayIdx, slotIdx)) return;
    if (!canPlaceTurmaOnSchedule(selectedCourse, schedule, placementContext)) return;

    const next = placeTurmaOnSchedule(
      selectedCourse,
      schedule,
      placementContext
    );
    setSchedule(next);

    const partner = resolvePendingCorequisitoPartner(
      selectedCourse,
      next,
      placementContext,
      visible.courses
    );
    setSelectedCourse(partner);
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

    const state = resolveEnrollmentCourseSelectability(
      course,
      visible.courses,
      schedule,
      placementContext,
      corequisitoObligation
    );

    if (state.timeLocked) {
      const notice = resolveEnrollmentScheduleConflictNotice(
        course,
        visible.courses,
        schedule,
        placementContext
      );

      setSelectedCourse(course);
      setConflictNotice(notice);
      setConflictNoticeEpoch((value) => value + 1);
      triggerBlockingFlash(course);
      scrollEnrollmentScheduleIntoView();
      return;
    }

    if (!isCorequisitoPartnerSelection(course, corequisitoObligation)) return;

    const isDeselect = selectedCourse?.turmaSigaaId === course.turmaSigaaId;

    if (isDeselect) {
      setSelectedCourse(null);
      setConflictNotice(null);
      clearBlockingFlash();
      return;
    }

    setSelectedCourse(course);
    setConflictNotice(null);
    clearBlockingFlash();
    scrollEnrollmentScheduleIntoView();
  };

  const handleClearSchedule = () => {
    setSchedule(createEmptySchedule());
    setSelectedCourse(null);
    setConflictNotice(null);
    clearBlockingFlash();
    setDetail(null);
  };

  return (
    <>
      <SectionHeader title="Simulador de Matrícula" icon="map" />

      <div className="enrollment-layout">
        <div className="enrollment-schedule-stack">
          {selectedCourse && selectedShortLabel && canPlaceSelectedCourse ? (
            <EnrollmentSelectionFloat
              selectedCourse={selectedCourse}
              selectedShortLabel={selectedShortLabel}
              selectedHorario={selectedHorario}
              onDismiss={() => setSelectedCourse(null)}
            />
          ) : null}

          <EnrollmentSchedulePanel
            schedule={schedule}
            catalog={visible.courses}
            placedCount={scheduleStats.placedCount}
            totalCh={scheduleStats.totalCh}
            semestreLabel={data.semestre}
            highlightEmpty={canPlaceSelectedCourse}
            allowedEmptyCells={allowedEmptyCells}
            blockingCellKeys={blockingFlashCellKeys}
            onSlotClick={handleSlotClick}
            onEmptyClick={handleEmptyClick}
            onClearSchedule={handleClearSchedule}
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
          onSelect={handleCourseClick}
        />
      </div>

      {conflictNotice ? (
        <EnrollmentConflictNotice
          key={conflictNoticeEpoch}
          notice={conflictNotice}
          onDismiss={() => setConflictNotice(null)}
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
            onRemove={() => removeTurma(detail.slot.turmaSigaaId)}
          />
        ) : null}
      </Modal>
    </>
  );
}
