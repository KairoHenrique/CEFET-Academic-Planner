import {
  splitTimeSlot,
  timeSlots,
  weekDays,
  type ScheduleSlot,
  type ScheduleSlotData,
} from "../types";
import type {
  TurmaOfertadaCourse,
  TurmasOfertadasResponse,
} from "../types";
import { formatSchedulePositions } from "./deps/subject-schedule-meta";
import { normalizeDisciplinaCode } from "./deps/normalize-code";
import {
  buildDisciplineShortLabelRegistry,
  resolveSubjectShortLabel,
} from "./deps/subject-display-name";
import { parseSigaaCodigoHorario } from "./deps/parse-sigaa-codigo";
import type { ScheduleCellPosition } from "./deps/sigaa-slot-map";

const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;

function resolveTurmaSchedulePositions(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): ScheduleCellPosition[] {
  if (course.slots.length > 0) {
    return course.slots.map((slot) => ({
      dayIdx: slot.day,
      slotIdx: slot.slot,
    }));
  }

  return parseSigaaCodigoHorario(course.codigoHorario);
}

/** Horário legível — ex.: "Seg 07:00 a 08:40, Qui 13:50 a 15:30". */
export function formatTurmaHorarioLegivel(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): string | null {
  const positions = resolveTurmaSchedulePositions(course);
  if (positions.length === 0) return null;

  const sorted = [...positions].sort((left, right) => {
    if (left.dayIdx !== right.dayIdx) return left.dayIdx - right.dayIdx;
    return left.slotIdx - right.slotIdx;
  });

  const segments = sorted.map(({ dayIdx, slotIdx }) => {
    const day = DAY_SHORT[dayIdx] ?? weekDays[dayIdx]?.slice(0, 3) ?? "?";
    const slotLabel = timeSlots[slotIdx];
    if (!slotLabel) {
      return formatSchedulePositions([{ dayIdx, slotIdx }]) ?? day;
    }

    const { start, end } = splitTimeSlot(slotLabel);
    return `${day} ${start} a ${end}`;
  });

  return segments.join(", ");
}

/** Horário de uma célula da grade — ex.: "Qui 15:50 a 17:30". */
export function formatScheduleCellHorario(dayIdx: number, slotIdx: number): string {
  const day = DAY_SHORT[dayIdx] ?? weekDays[dayIdx]?.slice(0, 3) ?? "?";
  const slotLabel = timeSlots[slotIdx];
  if (!slotLabel) return day;

  const { start, end } = splitTimeSlot(slotLabel);
  return `${day} ${start} a ${end}`;
}

/** Horário com rótulo para cards — ex.: "Horários: Seg 07:00 a 08:40, Qui 13:50 a 15:30". */
export function formatTurmaHorarioDisplay(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): string | null {
  const legivel = formatTurmaHorarioLegivel(course);
  if (!legivel) return null;
  return `Horários: ${legivel}`;
}

/** Rótulo curto para chips de horário (primeiro bloco ou texto compacto). */
export function formatTurmaHorarioChip(
  course: Pick<TurmaOfertadaCourse, "slots" | "codigoHorario">
): string | null {
  const legivel = formatTurmaHorarioLegivel(course);
  if (!legivel) return null;
  const first = legivel.split(", ")[0]?.trim();
  return first || legivel;
}

/** Sigla resumida para UI (AEDI, LAOCI…) — nunca `01/1`. */
export function formatTurmaShortLabel(
  course: Pick<TurmaOfertadaCourse, "code" | "name" | "shortLabel">,
  registry?: Map<string, string>
): string {
  const attached = course.shortLabel?.trim();
  if (attached) return attached;

  return resolveSubjectShortLabel(course.code, null, course.name, registry);
}

export function buildTurmaShortLabelRegistry(
  catalog: Pick<TurmaOfertadaCourse, "code" | "name">[]
): Map<string, string> {
  return buildDisciplineShortLabelRegistry(
    catalog.map((course) => ({
      code: course.code,
      name: course.name,
    }))
  );
}

function looksLikePpcCode(code: string): boolean {
  return /^\d+\/\d+$/.test(code.trim());
}

export function formatDisciplinaCodeShortLabel(
  code: string,
  catalog: Pick<TurmaOfertadaCourse, "code" | "name">[],
  registry?: Map<string, string>
): string {
  const match = catalog.find(
    (item) =>
      normalizeDisciplinaCode(item.code) === normalizeDisciplinaCode(code)
  );
  if (match) return formatTurmaShortLabel(match, registry);

  if (looksLikePpcCode(code)) {
    return "Disc";
  }

  return resolveSubjectShortLabel(code, null, null, registry);
}

export function formatDisciplinaCodesShortLabels(
  codes: string[],
  catalog: Pick<TurmaOfertadaCourse, "code" | "name">[],
  registry?: Map<string, string>
): string {
  return codes
    .map((code) => formatDisciplinaCodeShortLabel(code, catalog, registry))
    .join(", ");
}

export function formatDisciplinaCodeName(
  code: string,
  catalog: Pick<TurmaOfertadaCourse, "code" | "name">[],
  nameRegistry: Readonly<Record<string, string>> = {}
): string {
  const normalized = normalizeDisciplinaCode(code);
  const match = catalog.find(
    (item) => normalizeDisciplinaCode(item.code) === normalized
  );
  if (match?.name?.trim()) return match.name.trim();

  const fromRegistry = nameRegistry[normalized]?.trim();
  if (fromRegistry) return fromRegistry;

  return code;
}

export function formatDisciplinaCodeNames(
  codes: string[],
  catalog: Pick<TurmaOfertadaCourse, "code" | "name">[],
  nameRegistry: Readonly<Record<string, string>> = {}
): string {
  return codes
    .map((code) => formatDisciplinaCodeName(code, catalog, nameRegistry))
    .join(", ");
}

export interface SimuladorTurmasView {
  curso: TurmaOfertadaCourse[];
  optativas: TurmaOfertadaCourse[];
  courses: TurmaOfertadaCourse[];
  shortLabelRegistry: Map<string, string>;
  hasVisibleCourses: boolean;
}

/** Mantém só turmas elegíveis: concluídas e bloqueadas ficam fora da lista. */
export function filterSimuladorTurmas(
  data: TurmasOfertadasResponse
): SimuladorTurmasView {
  const keep = (course: TurmaOfertadaCourse) =>
    course.status === "unlocked" || course.status === "conditional";
  const curso = data.curso.filter(keep);
  const optativas = data.optativas.filter(keep);
  const courses = [...curso, ...optativas];
  const shortLabelRegistry = new Map<string, string>();
  for (const course of data.courses) {
    if (!course.shortLabel?.trim()) continue;
    shortLabelRegistry.set(
      normalizeDisciplinaCode(course.code),
      course.shortLabel.trim()
    );
  }
  if (shortLabelRegistry.size === 0) {
    for (const course of courses) {
      shortLabelRegistry.set(
        normalizeDisciplinaCode(course.code),
        formatTurmaShortLabel(course)
      );
    }
  }

  return {
    curso,
    optativas,
    courses,
    shortLabelRegistry,
    hasVisibleCourses: curso.length + optativas.length > 0,
  };
}

export function turmaToSlotData(
  course: TurmaOfertadaCourse,
  registry?: Map<string, string>
): ScheduleSlotData {
  const shortLabel = formatTurmaShortLabel(course, registry);

  return {
    code: course.code,
    name: shortLabel,
    displayName: course.name,
    room: course.room,
    color: course.color,
    professor: course.professor,
    ch: course.ch,
    turmaSigaaId: course.turmaSigaaId,
    courseName: course.name,
    semestre: course.semestre,
  };
}

export function isTurmaSelectable(course: TurmaOfertadaCourse): boolean {
  return course.status === "unlocked" || course.status === "conditional";
}

export function formatTurmasSyncedAt(iso: string | null): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
