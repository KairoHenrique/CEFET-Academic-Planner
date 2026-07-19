import { splitTimeSlot, timeSlots, weekDays } from "../../types";
import type { ScheduleCellPosition } from "./sigaa-slot-map";

const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;

export function formatSchedulePositions(
  positions: ScheduleCellPosition[]
): string | null {
  if (positions.length === 0) return null;
  const sorted = [...positions].sort((a, b) => {
    if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
    return a.slotIdx - b.slotIdx;
  });
  const segments = sorted.map((position) => {
    const day = DAY_SHORT[position.dayIdx] ?? weekDays[position.dayIdx]?.slice(0, 3);
    const start = splitTimeSlot(timeSlots[position.slotIdx] ?? "").start;
    return `${day} ${start}`;
  });
  return segments.join(" · ");
}
