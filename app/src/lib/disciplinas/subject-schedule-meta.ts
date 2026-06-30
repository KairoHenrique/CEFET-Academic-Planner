import { parseHorarioTraduzido } from "@/lib/schedule/parse-horario-traduzido";
import { parseSigaaCodigoHorario } from "@/lib/schedule/parse-sigaa-codigo";
import type { ScheduleCellPosition } from "@/lib/schedule/sigaa-slot-map";
import { splitTimeSlot, timeSlots, weekDays } from "@/lib/types/schedule";
import type { SemestreAtualRow } from "@/lib/types/db";

/** Cada bloco do horário SIGAA (1h40) equivale a 2h de carga horária semanal. */
export const SCHEDULE_WEEKLY_HOURS_PER_SLOT = 2;

const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;

export const SUBJECT_SCHEDULE_MAX_LENGTH = 120;
export const SUBJECT_PROFESSOR_MAX_LENGTH = 80;
export const SUBJECT_WEEKLY_HOURS_MAX = 40;

type SemestreScheduleSource = Pick<
  SemestreAtualRow,
  | "codigo_horario"
  | "horario_traduzido"
  | "horario_exibicao"
  | "professor"
  | "professor_exibicao"
  | "horas_semanais_exibicao"
>;

export function resolveSchedulePositions(
  semestre: Pick<SemestreAtualRow, "codigo_horario" | "horario_traduzido">
): ScheduleCellPosition[] {
  const fromSigaa = parseSigaaCodigoHorario(semestre.codigo_horario);
  if (fromSigaa.length > 0) return fromSigaa;
  return parseHorarioTraduzido(semestre.horario_traduzido);
}

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

export function computeWeeklyHoursFromPositions(
  positions: ScheduleCellPosition[]
): number | null {
  if (positions.length === 0) return null;
  return positions.length * SCHEDULE_WEEKLY_HOURS_PER_SLOT;
}

export function resolveSyncedSchedule(
  semestre: Pick<SemestreAtualRow, "codigo_horario" | "horario_traduzido">
): string | null {
  const translated = semestre.horario_traduzido?.trim();
  if (translated) return translated;
  return formatSchedulePositions(resolveSchedulePositions(semestre));
}

export function resolveSyncedWeeklyHours(
  semestre: Pick<SemestreAtualRow, "codigo_horario" | "horario_traduzido">
): number | null {
  return computeWeeklyHoursFromPositions(resolveSchedulePositions(semestre));
}

export function resolveSyncedProfessor(
  semestre: Pick<SemestreAtualRow, "professor">
): string | null {
  const professor = semestre.professor?.trim();
  return professor || null;
}

export function resolveDisplaySchedule(semestre: SemestreScheduleSource): string | null {
  const custom = semestre.horario_exibicao?.trim();
  if (custom) return custom;
  return resolveSyncedSchedule(semestre);
}

export function resolveDisplayWeeklyHours(
  semestre: SemestreScheduleSource
): number | null {
  if (semestre.horas_semanais_exibicao != null && semestre.horas_semanais_exibicao > 0) {
    return semestre.horas_semanais_exibicao;
  }
  return resolveSyncedWeeklyHours(semestre);
}

export function resolveDisplayProfessor(
  semestre: SemestreScheduleSource
): string | null {
  const custom = semestre.professor_exibicao?.trim();
  if (custom) return custom;
  return resolveSyncedProfessor(semestre);
}

export function sanitizeSubjectSchedule(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, SUBJECT_SCHEDULE_MAX_LENGTH);
}

export function sanitizeSubjectProfessor(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, SUBJECT_PROFESSOR_MAX_LENGTH);
}

export function sanitizeWeeklyHours(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const hours = Math.trunc(value);
  if (hours <= 0 || hours > SUBJECT_WEEKLY_HOURS_MAX) return null;
  return hours;
}
