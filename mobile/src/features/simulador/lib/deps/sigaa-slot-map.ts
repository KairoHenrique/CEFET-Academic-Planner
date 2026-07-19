import { splitTimeSlot, timeSlots, weekDays } from "../../types";

/** Dia SIGAA (2=Seg … 6=Sex) → índice em `weekDays`. */
export const SIGAA_DAY_TO_INDEX: Record<number, number> = {
  2: 0,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
};

/** Código de bloco SIGAA → índice em `timeSlots`. */
export const SIGAA_BLOCK_TO_SLOT_INDEX: Record<string, number> = {
  M12: 0,
  M34: 1,
  M56: 2,
  T12: 3,
  T34: 4,
  N12: 5,
  N34: 6,
};

const DAY_ABBREV_TO_INDEX: Record<string, number> = {
  seg: 0,
  segundafeira: 0,
  ter: 1,
  terca: 1,
  terça: 1,
  qua: 2,
  quartafeira: 2,
  qui: 3,
  quintafeira: 3,
  sex: 4,
  sextafeira: 4,
};

const SLOT_START_TIMES = timeSlots.map(
  (slot) => splitTimeSlot(slot).start
);

export interface ScheduleCellPosition {
  dayIdx: number;
  slotIdx: number;
}

export function createEmptyScheduleGrid(): (null)[][] {
  return weekDays.map(() => timeSlots.map(() => null));
}

export function resolveDayIndexFromAbbrev(dayToken: string): number | null {
  const normalized = dayToken
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

  return DAY_ABBREV_TO_INDEX[normalized] ?? null;
}

export function resolveSlotIndexFromStartTime(timeToken: string): number | null {
  const normalized = timeToken.trim().padStart(5, "0");
  const index = SLOT_START_TIMES.indexOf(normalized);
  return index >= 0 ? index : null;
}
