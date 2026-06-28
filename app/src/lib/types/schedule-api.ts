import type { ScheduleSlotData } from "./schedule";

export interface ScheduleApiSlot extends ScheduleSlotData {
  /** Nome completo ou personalizado (UI detalhada / tooltip). */
  displayName?: string;
}

export interface ScheduleApiResponse {
  days: string[];
  timeSlots: string[];
  grid: (ScheduleApiSlot | null)[][];
}
