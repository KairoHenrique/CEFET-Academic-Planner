import { normalizeDisciplinaCode } from "./deps/normalize-code";
import type { ScheduleSlot } from "../types";

export interface SimuladorPlacementContext {
  completed: Set<string>;
  coRequisitos: Map<string, string[]>;
  disciplinaNames: Readonly<Record<string, string>>;
}

export function buildSimuladorPlacementContext(input: {
  completedDisciplinaCodes: string[];
  coRequisitos: Record<string, string[]>;
  disciplinaNames?: Record<string, string>;
}): SimuladorPlacementContext {
  const completed = new Set(
    input.completedDisciplinaCodes.map(normalizeDisciplinaCode)
  );
  const coRequisitos = new Map<string, string[]>();

  for (const [disciplinaId, codes] of Object.entries(input.coRequisitos)) {
    coRequisitos.set(
      normalizeDisciplinaCode(disciplinaId),
      codes.map(normalizeDisciplinaCode)
    );
  }

  return {
    completed,
    coRequisitos,
    disciplinaNames: input.disciplinaNames ?? {},
  };
}

export function collectScheduledDisciplinaCodes(
  schedule: ScheduleSlot[][]
): Set<string> {
  const codes = new Set<string>();

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId) continue;
      codes.add(normalizeDisciplinaCode(slot.code));
    }
  }

  return codes;
}

export function resolveCoRequisitosForDisciplina(
  disciplinaCode: string,
  context: SimuladorPlacementContext
): string[] {
  return context.coRequisitos.get(normalizeDisciplinaCode(disciplinaCode)) ?? [];
}

export function isMutualCorequisite(
  disciplinaCode: string,
  coCode: string,
  context: SimuladorPlacementContext
): boolean {
  const normalized = normalizeDisciplinaCode(disciplinaCode);
  const coNormalized = normalizeDisciplinaCode(coCode);
  const forward = resolveCoRequisitosForDisciplina(normalized, context);
  const backward = resolveCoRequisitosForDisciplina(coNormalized, context);

  return forward.includes(coNormalized) && backward.includes(normalized);
}

/** Validação estrita da grade — exige parceiro alocado ou aprovado. */
export function resolveMissingCorequisitesOnSchedule(
  disciplinaCode: string,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): string[] {
  const scheduled = collectScheduledDisciplinaCodes(schedule);

  return resolveCoRequisitosForDisciplina(disciplinaCode, context).filter(
    (coCode) =>
      !context.completed.has(coCode) && !scheduled.has(normalizeDisciplinaCode(coCode))
  );
}

/** Corequisitos ainda não cumpridos ao tentar alocar (pares mútuos podem entrar em sequência). */
export function resolveMissingCorequisitesForPlacement(
  disciplinaCode: string,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): string[] {
  return resolveMissingCorequisitesOnSchedule(
    disciplinaCode,
    schedule,
    context
  ).filter(
    (coCode) => !isMutualCorequisite(disciplinaCode, coCode, context)
  );
}

export function hasMissingCorequisitesForPlacement(
  disciplinaCode: string,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): boolean {
  return (
    resolveMissingCorequisitesForPlacement(disciplinaCode, schedule, context)
      .length > 0
  );
}

export function findTurmaIdsWithMissingCorequisitos(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): string[] {
  const invalid = new Set<string>();

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId) continue;

      const missing = resolveMissingCorequisitesOnSchedule(
        slot.code,
        schedule,
        context
      );
      if (missing.length > 0) invalid.add(slot.turmaSigaaId);
    }
  }

  return Array.from(invalid);
}

export function pruneInvalidCorequisitoPlacements(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): ScheduleSlot[][] {
  let next = schedule.map((row) => [...row]);
  let changed = true;

  while (changed) {
    changed = false;
    const invalidIds = findTurmaIdsWithMissingCorequisitos(next, context);

    for (const turmaSigaaId of invalidIds) {
      next = next.map((row) =>
        row.map((slot) => (slot?.turmaSigaaId === turmaSigaaId ? null : slot))
      );
      changed = true;
    }
  }

  return next;
}

export function buildCorequisitoPlacementMessage(codes: string[]): string {
  if (codes.length === 0) return "";

  return `Alocar também na grade: ${codes.join(", ")} (ou já ter sido aprovado nestas disciplinas).`;
}

export const TURMA_COREQUISITO_BLOCK_MESSAGE =
  "Corequisito pendente. Inclua a disciplina parceira na grade antes desta.";
