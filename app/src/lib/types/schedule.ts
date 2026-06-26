export const timeSlots = [
  "07:00 - 08:40",
  "08:55 - 10:35",
  "10:50 - 12:30",
  "13:50 - 15:30",
  "15:50 - 17:30",
  "19:00 - 20:40",
  "20:55 - 22:35",
] as const;

export const weekDays = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
] as const;

export function splitTimeSlot(slot: string): { start: string; end: string } {
  const [start = "", end = ""] = slot.split(" - ");
  return { start: start.trim(), end: end.trim() };
}

export interface ScheduleSlotData {
  code: string;
  name: string;
  room: string;
  color: string;
  professor?: string;
  ch?: number;
}

export type ScheduleSlot = ScheduleSlotData | null;
