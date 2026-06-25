"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { ScheduleDetailContent } from "@/components/ui/ActivityDetail";
import {
  cloneSchedule,
  timeSlots,
  weekDays,
  weeklySchedule,
  type ScheduleSlot,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import {
  courseToSlotData,
  offeredCourses,
  type OfferedCourse,
} from "@/config/mock/enrollment";

export function EnrollmentSimulator() {
  const [schedule, setSchedule] = useState<ScheduleSlot[][]>(() =>
    cloneSchedule(weeklySchedule)
  );
  const [selectedCourse, setSelectedCourse] = useState<OfferedCourse | null>(
    null
  );
  const [pendingPlacement, setPendingPlacement] = useState<{
    dayIdx: number;
    slotIdx: number;
  } | null>(null);
  const [detail, setDetail] = useState<{
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  } | null>(null);

  const placeCourse = (dayIdx: number, slotIdx: number, course: OfferedCourse) => {
    setSchedule((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx][slotIdx] = courseToSlotData(course);
      return next;
    });
    setSelectedCourse(null);
    setPendingPlacement(null);
  };

  const removeSlot = (dayIdx: number, slotIdx: number) => {
    setSchedule((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx][slotIdx] = null;
      return next;
    });
    setDetail(null);
  };

  const handleEmptyClick = (dayIdx: number, slotIdx: number) => {
    if (selectedCourse) {
      placeCourse(dayIdx, slotIdx, selectedCourse);
      return;
    }
    setPendingPlacement({ dayIdx, slotIdx });
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

  const handleCourseClick = (course: OfferedCourse) => {
    if (course.status === "locked") return;

    if (course.slots.length === 1) {
      const { day, slot } = course.slots[0];
      if (!schedule[day]?.[slot]) {
        placeCourse(day, slot, course);
        return;
      }
    }

    setSelectedCourse((prev) => (prev?.code === course.code ? null : course));
    setPendingPlacement(null);
  };

  return (
    <>
      <div className="card enrollment-card">
        <SectionHeader title="Simulador de Matrícula" icon="map" />

        <p className="enrollment-hint">
          {selectedCourse
            ? `Selecionado: ${selectedCourse.code} — clique em um horário vazio para alocar`
            : "Clique em uma turma desbloqueada e depois em um horário vazio, ou clique em uma aula para ver detalhes"}
        </p>

        <div className="enrollment-layout">
          <div className="enrollment-sidebar">
            <h4 className="enrollment-subtitle">Turmas elegíveis</h4>
            <ul className="enrollment-course-list">
              {offeredCourses.map((course) => (
                <li key={course.code}>
                  <button
                    type="button"
                    disabled={course.status === "locked"}
                    className={`enrollment-course enrollment-course-btn ${
                      course.status
                    } ${selectedCourse?.code === course.code ? "selected" : ""}`}
                    onClick={() => handleCourseClick(course)}
                  >
                    <Icon
                      name={course.status === "unlocked" ? "unlock" : "lock"}
                      size={14}
                    />
                    <div>
                      <p className="course-node-code">{course.code}</p>
                      <p className="course-node-name">{course.name}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="enrollment-schedule">
            <h4 className="enrollment-subtitle">Grade simulada</h4>
            <WeeklyScheduleTable
              schedule={schedule}
              compact
              simulated
              interactive
              highlightEmpty={Boolean(selectedCourse)}
              selectedDay={pendingPlacement?.dayIdx ?? null}
              selectedSlot={pendingPlacement?.slotIdx ?? null}
              onSlotClick={handleSlotClick}
              onEmptyClick={handleEmptyClick}
            />
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.slot.name ?? "Atividade"}
      >
        {detail && (
          <ScheduleDetailContent
            slot={detail.slot}
            day={detail.day}
            time={detail.time}
            simulated
            onClose={() => setDetail(null)}
            onRemove={() => removeSlot(detail.dayIdx, detail.slotIdx)}
          />
        )}
      </Modal>
    </>
  );
}
