"use client";

import { useState } from "react";
import {
  timeSlots,
  weekDays,
  weeklySchedule,
  type ScheduleSlot,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import { Modal } from "@/components/ui/Modal";
import { ScheduleDetailContent } from "@/components/ui/ActivityDetail";

interface WeeklyScheduleTableProps {
  schedule?: ScheduleSlot[][];
  compact?: boolean;
  simulated?: boolean;
  interactive?: boolean;
  onSlotClick?: (payload: {
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  }) => void;
  onEmptyClick?: (dayIdx: number, slotIdx: number) => void;
  highlightEmpty?: boolean;
  selectedDay?: number | null;
  selectedSlot?: number | null;
}

export function WeeklyScheduleTable({
  schedule = weeklySchedule,
  compact = false,
  simulated = false,
  interactive = true,
  onSlotClick,
  onEmptyClick,
  highlightEmpty = false,
  selectedDay,
  selectedSlot,
}: WeeklyScheduleTableProps) {
  const [detail, setDetail] = useState<{
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  } | null>(null);

  const handleSlotClick = (
    slot: ScheduleSlotData,
    day: string,
    time: string,
    dayIdx: number,
    slotIdx: number
  ) => {
    if (onSlotClick) {
      onSlotClick({ slot, day, time, dayIdx, slotIdx });
      return;
    }
    setDetail({ slot, day, time, dayIdx, slotIdx });
  };

  return (
    <>
      <div className={`schedule-wrapper ${compact ? "schedule-compact" : ""}`}>
        <table className={`schedule-table ${compact ? "schedule-table-compact" : ""}`}>
          <thead>
            <tr>
              <th />
              {timeSlots.map((slot) => (
                <th key={slot}>{compact ? slot.replace("–", "-").slice(0, 5) : slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day, dayIdx) => (
              <tr key={day}>
                <td className="day-label">{compact ? day.slice(0, 3) : day}</td>
                {timeSlots.map((time, slotIdx) => {
                  const slot = schedule[dayIdx]?.[slotIdx];
                  const isTarget =
                    highlightEmpty &&
                    selectedDay === dayIdx &&
                    selectedSlot === slotIdx;

                  return (
                    <td key={slotIdx}>
                      {slot ? (
                        <button
                          type="button"
                          className="schedule-slot schedule-slot-btn"
                          style={{ "--slot-color": slot.color } as React.CSSProperties}
                          onClick={() =>
                            interactive &&
                            handleSlotClick(slot, day, time, dayIdx, slotIdx)
                          }
                        >
                          <div className="schedule-slot-name">{slot.name}</div>
                          <div className="schedule-slot-room">{slot.room}</div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`schedule-slot-empty schedule-slot-empty-btn ${
                            isTarget ? "schedule-slot-target" : ""
                          }`}
                          onClick={() =>
                            interactive && onEmptyClick?.(dayIdx, slotIdx)
                          }
                          aria-label={`Horário vazio ${day} ${time}`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!onSlotClick && (
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
              simulated={simulated}
              onClose={() => setDetail(null)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
