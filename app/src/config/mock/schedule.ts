export {
  timeSlots,
  weekDays,
  splitTimeSlot,
  type ScheduleSlotData,
  type ScheduleSlot,
} from "@/lib/types/schedule";
import { timeSlots, weekDays, type ScheduleSlot } from "@/lib/types/schedule";

export const weeklySchedule: ScheduleSlot[][] = [
  [null, null, null, { code: "AEDI", name: "AEDI", room: "303", color: "#3AA0E8", professor: "Prof. João Silva", ch: 60 }, null, null, null],
  [null, { code: "AOCI", name: "AOCI", room: "314", color: "#D4A843", professor: "Prof. Maria Costa", ch: 60 }, null, null, null, { code: "EMPREEND", name: "Empreend.", room: "303", color: "#3FB950", professor: "Prof. Carlos Mendes", ch: 30 }, { code: "SOCIOLOGIA", name: "Sociologia", room: "619", color: "#A371F7", professor: "Prof. Rita Alves", ch: 30 }],
  [{ code: "ENG-SOFT", name: "Eng. Soft.", room: "301", color: "#F47067", professor: "Prof. Ana Lima", ch: 60 }, { code: "LAEDI", name: "LAEDI", room: "604", color: "#3AA0E8", professor: "Prof. João Silva", ch: 30 }, null, null, null, null, null],
  [null, { code: "LAOCI", name: "LAOCI", room: "314", color: "#D4A843", professor: "Prof. Maria Costa", ch: 30 }, { code: "ENG-SOFT", name: "Eng. Soft.", room: "303", color: "#F47067", professor: "Prof. Ana Lima", ch: 60 }, null, null, null, null],
  [null, null, { code: "AEDI", name: "AEDI", room: "620", color: "#3AA0E8", professor: "Prof. João Silva", ch: 60 }, null, null, null, null],
];

export function cloneSchedule(grid: ScheduleSlot[][]): ScheduleSlot[][] {
  return grid.map((row) => row.map((slot) => (slot ? { ...slot } : null)));
}

export function createEmptySchedule(): ScheduleSlot[][] {
  return weekDays.map(() => timeSlots.map(() => null));
}
