"use client";

import { useState } from "react";
import {
  timeSlots,
  weekDays,
  splitTimeSlot,
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
  /** Células vazias onde a turma selecionada pode ser alocada (`dayIdx:slotIdx`). */
  allowedEmptyCells?: ReadonlySet<string> | null;
  /** Células ocupadas que bloqueiam turmas (contorno vermelho). */
  blockingCellKeys?: ReadonlySet<string> | null;
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
  allowedEmptyCells = null,
  blockingCellKeys = null,
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
              <th className="schedule-day-col" aria-hidden="true" />
              {timeSlots.map((slot) => {
                const { start, end } = splitTimeSlot(slot);
                return (
                  <th key={slot} className="schedule-time-col">
                    {compact ? (
                      <span className="schedule-time-range">
                        {start} – {end}
                      </span>
                    ) : (
                      slot
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day, dayIdx) => (
              <tr key={day}>
                <td className="day-label schedule-day-col">{compact ? day.slice(0, 3) : day}</td>
                {timeSlots.map((time, slotIdx) => {
                  const slot = schedule[dayIdx]?.[slotIdx];
                  const cellKey = `${dayIdx}:${slotIdx}`;
                  const isAllowedEmpty =
                    Boolean(allowedEmptyCells?.has(cellKey)) && !slot;
                  const isForbiddenEmpty =
                    highlightEmpty &&
                    Boolean(allowedEmptyCells) &&
                    !slot &&
                    !allowedEmptyCells?.has(cellKey);
                  const isTarget =
                    highlightEmpty &&
                    selectedDay === dayIdx &&
                    selectedSlot === slotIdx;
                  const isBlocking =
                    Boolean(slot) && Boolean(blockingCellKeys?.has(cellKey));

                  return (
                    <td key={slotIdx} className="schedule-cell">
                      {slot ? (
                        <button
                          type="button"
                          className={[
                            "schedule-slot",
                            "schedule-slot-btn",
                            isBlocking ? "schedule-slot-blocking" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={
                            { "--slot-color": slot.color } as React.CSSProperties
                          }
                          onClick={() =>
                            interactive &&
                            handleSlotClick(slot, day, time, dayIdx, slotIdx)
                          }
                          tabIndex={interactive ? undefined : -1}
                        >
                          <div className="schedule-slot-name">{slot.name}</div>
                          <div className="schedule-slot-room">{slot.room}</div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={[
                            "schedule-slot-empty",
                            "schedule-slot-empty-btn",
                            isTarget ? "schedule-slot-target" : "",
                            isAllowedEmpty ? "schedule-slot-allowed" : "",
                            isForbiddenEmpty ? "schedule-slot-forbidden" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          disabled={isForbiddenEmpty}
                          onClick={() => {
                            if (!interactive || isForbiddenEmpty) return;
                            onEmptyClick?.(dayIdx, slotIdx);
                          }}
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
