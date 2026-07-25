/** Tipos espelho de `app/src/lib/types/turmas-ofertadas-api.ts` + schedule. */

export type TurmaOfertadaEnrollmentStatus =
  | "done"
  | "unlocked"
  | "conditional"
  | "locked";

export type TurmaOfertadaCategoriaApi = "curso" | "optativa";

export interface TurmaOfertadaSlot {
  day: number;
  slot: number;
}

export type TurmaPrerequisiteHint = "conditional" | null;

export interface TurmaOfertadaCourse {
  turmaSigaaId: string;
  code: string;
  name: string;
  shortLabel?: string;
  status: TurmaOfertadaEnrollmentStatus;
  pendingPrereqCodes: string[];
  prerequisiteHint: TurmaPrerequisiteHint;
  coRequisitoCodes: string[];
  waivedCoRequisitoCodes: string[];
  color: string;
  room: string;
  professor: string;
  ch: number;
  turmaCodigo: string | null;
  semestre: string;
  periodo: number | null;
  codigoHorario: string | null;
  vagas: number | null;
  slots: TurmaOfertadaSlot[];
  situacao: "atendida" | "pendente";
  categoria: TurmaOfertadaCategoriaApi;
  scheduleBlocker: boolean;
  scheduleWarningMessage: string | null;
  sigaaComponente?: string | null;
  departamento?: string | null;
}

export interface TurmasOfertadasEnrollmentContext {
  completedDisciplinaCodes: string[];
  coRequisitos: Record<string, string[]>;
  disciplinaNames: Record<string, string>;
}

export interface TurmasOfertadasResponse {
  semestre: string;
  syncedAt: string | null;
  enrollmentContext: TurmasOfertadasEnrollmentContext;
  curso: TurmaOfertadaCourse[];
  optativas: TurmaOfertadaCourse[];
  courses: TurmaOfertadaCourse[];
  empty: boolean;
}

export interface ScheduleSlotData {
  code: string;
  name: string;
  room: string;
  color: string;
  professor?: string;
  ch?: number;
  displayName?: string;
  turmaSigaaId?: string;
  courseName?: string;
  semestre?: string;
}

export type ScheduleSlot = ScheduleSlotData | null;

export const TIME_SLOTS = [
  "07:00 - 08:40",
  "08:55 - 10:35",
  "10:50 - 12:30",
  "13:50 - 15:30",
  "15:50 - 17:30",
  "19:00 - 20:40",
  "20:55 - 22:35",
] as const;

export const WEEK_DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
] as const;

/** Aliases do site (`@/lib/types/schedule`). */
export const timeSlots = TIME_SLOTS;
export const weekDays = WEEK_DAYS;

export function splitTimeSlot(slot: string): { start: string; end: string } {
  const [start = "", end = ""] = slot.split(" - ");
  return { start: start.trim(), end: end.trim() };
}

export function createEmptySchedule(): ScheduleSlot[][] {
  return WEEK_DAYS.map(() => TIME_SLOTS.map(() => null));
}

export function scheduleCellKey(dayIdx: number, slotIdx: number): string {
  return `${dayIdx}:${slotIdx}`;
}

export const TURMA_SCHEDULE_BLOCKER_MESSAGE =
  "Sem horário no SIGAA — clique em um slot vazio para simular manualmente.";

export const TURMA_SCHEDULE_UNCERTAIN_MESSAGE =
  "Horário informado no SIGAA, mas pode não estar 100% definido. Confirme antes da matrícula.";

export const TURMA_PREREQ_CONDITIONAL_MESSAGE =
  "Depende de disciplinas que você está cursando neste semestre. Só será possível se forem aprovadas.";

export interface SimuladorChoqueCell {
  dayIdx: number;
  slotIdx: number;
  horario: string;
}

export interface SimuladorChoquePair {
  turmaSigaaIdA: string;
  codeA: string;
  nameA: string;
  turmaSigaaIdB: string;
  codeB: string;
  nameB: string;
  cells: SimuladorChoqueCell[];
}
