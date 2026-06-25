export const timeSlots = [
  "7:00–8:40",
  "8:55–10:35",
  "10:50–12:30",
  "13:50–15:30",
  "15:50–17:30",
  "19:00–20:40",
  "20:55–22:35",
] as const;

export const weekDays = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
] as const;

export interface ScheduleSlotData {
  code: string;
  name: string;
  room: string;
  color: string;
  professor?: string;
  ch?: number;
}

export type ScheduleSlot = ScheduleSlotData | null;
