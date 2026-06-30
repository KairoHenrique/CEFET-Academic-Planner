import { notFoundError } from "@/lib/api/errors";
import { resolveSubjectShortLabel } from "@/lib/disciplinas/subject-display-name";
import { getAluno, getSemestreAtual } from "@/lib/db/queries";
import type { SemestreAtualWithDisciplina } from "@/lib/types/db";
import type {
  ScheduleApiResponse,
  ScheduleApiSlot,
} from "@/lib/types/schedule-api";
import { timeSlots, weekDays } from "@/lib/types/schedule";
import { parseHorarioTraduzido } from "./parse-horario-traduzido";
import { parseSigaaCodigoHorario } from "./parse-sigaa-codigo";
import { resolveSubjectDisplayRoom } from "@/lib/disciplinas/subject-room";
import { resolveDisplayWeeklyHours } from "@/lib/disciplinas/subject-schedule-meta";
import { resolveSlotRooms } from "./resolve-slot-rooms";
import {
  createEmptyScheduleGrid,
  type ScheduleCellPosition,
} from "./sigaa-slot-map";

function sortPositions(
  positions: ScheduleCellPosition[]
): ScheduleCellPosition[] {
  return [...positions].sort((a, b) => {
    if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
    return a.slotIdx - b.slotIdx;
  });
}

function resolveSchedulePositions(
  row: SemestreAtualWithDisciplina
): ScheduleCellPosition[] {
  const fromSigaa = parseSigaaCodigoHorario(row.codigo_horario);
  if (fromSigaa.length > 0) return sortPositions(fromSigaa);
  return sortPositions(parseHorarioTraduzido(row.horario_traduzido));
}

function buildSlotData(
  row: SemestreAtualWithDisciplina,
  room: string
): ScheduleApiSlot {
  const displayName = row.nome_exibicao?.trim() || row.nome;
  const shortLabel = resolveSubjectShortLabel(
    row.disciplina_id,
    row.apelido,
    row.nome_exibicao?.trim() || row.nome
  );

  return {
    code: row.disciplina_id,
    name: shortLabel,
    room,
    color: row.cor ?? "#3AA0E8",
    professor: row.professor ?? undefined,
    ch: resolveDisplayWeeklyHours(row) ?? undefined,
    displayName,
  };
}

function placeSubjectOnGrid(
  grid: (ScheduleApiSlot | null)[][],
  row: SemestreAtualWithDisciplina
): void {
  const positions = resolveSchedulePositions(row);
  if (positions.length === 0) return;

  const rooms = resolveSlotRooms(resolveSubjectDisplayRoom(row), positions.length);

  positions.forEach((position, index) => {
    if (grid[position.dayIdx]?.[position.slotIdx]) return;
    grid[position.dayIdx][position.slotIdx] = buildSlotData(
      row,
      rooms[index] ?? "—"
    );
  });
}

export function buildScheduleGrid(): ScheduleApiResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const semestre = getSemestreAtual();
  const grid: (ScheduleApiSlot | null)[][] = createEmptyScheduleGrid();

  for (const row of semestre) {
    placeSubjectOnGrid(grid, row);
  }

  return {
    days: [...weekDays],
    timeSlots: [...timeSlots],
    grid,
  };
}
