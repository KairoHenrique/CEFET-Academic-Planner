import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import {
  collectScheduledDisciplinaCodes,
  isMutualCorequisite,
  pruneInvalidCorequisitoPlacements,
  resolveCoRequisitosForDisciplina,
  resolveMissingCorequisitesOnSchedule,
  type SimuladorPlacementContext,
} from "@/lib/simulador/corequisito-schedule-policy";
import {
  applyHypotheticalTurmaPlacement,
  canPlaceTurmaBasic,
  isTurmaPlacedOnSchedule,
  isTurmaScheduleLocked,
} from "@/lib/simulador/turma-schedule-placement";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";
import {
  formatDisciplinaCodeNames,
} from "@/lib/simulador/turma-course-utils";

function turmasForDisciplinaCode(
  code: string,
  catalog: TurmaOfertadaCourse[]
): TurmaOfertadaCourse[] {
  const normalized = normalizeDisciplinaCode(code);
  return catalog.filter(
    (course) => normalizeDisciplinaCode(course.code) === normalized
  );
}

function activeCorequisitoCodes(
  disciplinaCode: string,
  context: SimuladorPlacementContext
): string[] {
  return resolveCoRequisitosForDisciplina(disciplinaCode, context).filter(
    (code) => !context.completed.has(code)
  );
}

export function buildMutualCorequisitoCluster(
  disciplinaCode: string,
  context: SimuladorPlacementContext
): string[] {
  const cluster = new Set<string>();
  const queue = [normalizeDisciplinaCode(disciplinaCode)];

  while (queue.length > 0) {
    const code = queue.pop();
    if (!code || cluster.has(code)) continue;

    cluster.add(code);

    for (const coCode of activeCorequisitoCodes(code, context)) {
      if (isMutualCorequisite(code, coCode, context)) {
        queue.push(coCode);
      }
    }
  }

  return Array.from(cluster);
}

function existsMutualPairAssignment(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[],
  codeA: string,
  codeB: string,
  required?: TurmaOfertadaCourse
): boolean {
  const scheduled = collectScheduledDisciplinaCodes(schedule);

  if (scheduled.has(codeA) && scheduled.has(codeB)) {
    return (
      resolveMissingCorequisitesOnSchedule(codeA, schedule, context).length ===
        0 &&
      resolveMissingCorequisitesOnSchedule(codeB, schedule, context).length ===
        0
    );
  }

  const variantsA = turmasForDisciplinaCode(codeA, catalog);
  const variantsB = turmasForDisciplinaCode(codeB, catalog);

  if (scheduled.has(codeA)) {
    const pool =
      required && normalizeDisciplinaCode(required.code) === codeB
        ? [required]
        : variantsB;
    return pool.some((variant) => canPlaceTurmaBasic(variant, schedule, context));
  }

  if (scheduled.has(codeB)) {
    const pool =
      required && normalizeDisciplinaCode(required.code) === codeA
        ? [required]
        : variantsA;
    return pool.some((variant) => canPlaceTurmaBasic(variant, schedule, context));
  }

  const attemptPair = (
    firstPool: TurmaOfertadaCourse[],
    secondPool: TurmaOfertadaCourse[]
  ): boolean => {
    for (const first of firstPool) {
      const afterFirst = applyHypotheticalTurmaPlacement(first, schedule);
      if (!afterFirst) continue;

      for (const second of secondPool) {
        if (!canPlaceTurmaBasic(second, afterFirst, context)) continue;

        if (!required) return true;
        if (
          first.turmaSigaaId === required.turmaSigaaId ||
          second.turmaSigaaId === required.turmaSigaaId
        ) {
          return true;
        }
      }
    }

    return false;
  };

  if (required) {
    const requiredCode = normalizeDisciplinaCode(required.code);

    if (requiredCode === codeA) {
      return (
        attemptPair([required], variantsB) ||
        attemptPair(variantsB, [required])
      );
    }

    if (requiredCode === codeB) {
      return (
        attemptPair(variantsA, [required]) ||
        attemptPair([required], variantsB)
      );
    }
  }

  return (
    attemptPair(variantsA, variantsB) || attemptPair(variantsB, variantsA)
  );
}

function existsClusterAssignment(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[],
  cluster: string[],
  required?: TurmaOfertadaCourse
): boolean {
  const pending = cluster.filter((code) => !context.completed.has(code));
  if (pending.length === 0) return true;

  if (pending.length === 2) {
    return existsMutualPairAssignment(
      schedule,
      context,
      catalog,
      pending[0]!,
      pending[1]!,
      required
    );
  }

  if (required) {
    return canPlaceTurmaBasic(required, schedule, context);
  }

  return pending.every((code) =>
    turmasForDisciplinaCode(code, catalog).some((variant) =>
      canPlaceTurmaBasic(variant, schedule, context)
    )
  );
}

export function isCorequisitoClusterPlacementViable(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[]
): boolean {
  if (isTurmaPlacedOnSchedule(course, schedule)) return true;

  const active = activeCorequisitoCodes(course.code, context);
  if (active.length === 0) {
    return canPlaceTurmaBasic(course, schedule, context);
  }

  const hasMutualPartner = active.some((coCode) =>
    isMutualCorequisite(course.code, coCode, context)
  );

  if (!hasMutualPartner) {
    return (
      canPlaceTurmaBasic(course, schedule, context) &&
      active.every(
        (coCode) =>
          context.completed.has(coCode) ||
          collectScheduledDisciplinaCodes(schedule).has(coCode)
      )
    );
  }

  const cluster = buildMutualCorequisitoCluster(course.code, context);
  return existsClusterAssignment(
    schedule,
    context,
    catalog,
    cluster,
    course
  );
}

/** Par corequisito mútuo: tranca se alguma variante do parceiro já colide na grade. */
export function isMutualCorequisitoPartnerScheduleLocked(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[]
): boolean {
  if (isTurmaPlacedOnSchedule(course, schedule)) return false;

  const cluster = buildMutualCorequisitoCluster(course.code, context);
  if (cluster.length < 2) return false;

  const selfCode = normalizeDisciplinaCode(course.code);

  for (const partnerCode of cluster) {
    if (partnerCode === selfCode || context.completed.has(partnerCode)) continue;

    const variants = turmasForDisciplinaCode(partnerCode, catalog);
    if (variants.some((variant) => isTurmaScheduleLocked(variant, schedule))) {
      return true;
    }
  }

  return false;
}

export function resolvePendingCorequisitoPartner(
  placed: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[]
): TurmaOfertadaCourse | null {
  const missing = resolveMissingCorequisitesOnSchedule(
    placed.code,
    schedule,
    context
  );

  for (const coCode of missing) {
    if (!isMutualCorequisite(placed.code, coCode, context)) continue;

    const partners = turmasForDisciplinaCode(coCode, catalog);
    if (partners.length === 0) continue;

    return (
      partners.find((candidate) =>
        canPlaceTurmaBasic(candidate, schedule, context)
      ) ?? partners[0]!
    );
  }

  return null;
}

export interface CorequisitoObligation {
  partnerCode: string;
}

export function resolveActiveCorequisitoObligation(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): CorequisitoObligation | null {
  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId) continue;

      const missing = resolveMissingCorequisitesOnSchedule(
        slot.code,
        schedule,
        context
      );

      for (const coCode of missing) {
        if (isMutualCorequisite(slot.code, coCode, context)) {
          return { partnerCode: coCode };
        }
      }
    }
  }

  return null;
}

export function isCorequisitoPartnerSelection(
  course: TurmaOfertadaCourse,
  obligation: CorequisitoObligation | null
): boolean {
  if (!obligation) return true;

  return (
    normalizeDisciplinaCode(course.code) ===
    normalizeDisciplinaCode(obligation.partnerCode)
  );
}

/**
 * Cancela seleção do parceiro corequisito pendente — remove da grade a metade
 * já alocada (pares mútuos incompletos). Corequisito já aprovado não entra.
 */
export function wouldRollbackIncompleteCorequisitoPlacement(
  obligation: CorequisitoObligation | null,
  selectedCourse: TurmaOfertadaCourse | null
): boolean {
  if (!obligation || !selectedCourse) return false;
  return isCorequisitoPartnerSelection(selectedCourse, obligation);
}

export function resolveIncompleteCorequisitoPlacedHalf(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  obligation: CorequisitoObligation
): { turmaSigaaId: string; code: string } | null {
  const partnerCode = normalizeDisciplinaCode(obligation.partnerCode);

  for (const row of schedule) {
    for (const slot of row) {
      if (!slot?.turmaSigaaId) continue;

      const missing = resolveMissingCorequisitesOnSchedule(
        slot.code,
        schedule,
        context
      );

      if (
        missing.some(
          (coCode) => normalizeDisciplinaCode(coCode) === partnerCode
        )
      ) {
        return { turmaSigaaId: slot.turmaSigaaId, code: slot.code };
      }
    }
  }

  return null;
}

export function resolveMutualCorequisitoPartnerOnSchedule(
  turmaSigaaId: string,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[]
): TurmaOfertadaCourse | null {
  const course = catalog.find((item) => item.turmaSigaaId === turmaSigaaId);
  if (!course) return null;

  const scheduled = collectScheduledDisciplinaCodes(schedule);
  const selfCode = normalizeDisciplinaCode(course.code);

  for (const coCode of activeCorequisitoCodes(course.code, context)) {
    if (!isMutualCorequisite(course.code, coCode, context)) continue;
    if (!scheduled.has(normalizeDisciplinaCode(coCode))) continue;
    if (normalizeDisciplinaCode(coCode) === selfCode) continue;

    const partner = catalog.find(
      (item) =>
        normalizeDisciplinaCode(item.code) === normalizeDisciplinaCode(coCode) &&
        isTurmaPlacedOnSchedule(item, schedule)
    );
    if (partner) return partner;
  }

  return null;
}

export function rollbackIncompleteCorequisitoPlacement(
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  obligation: CorequisitoObligation | null,
  selectedCourse: TurmaOfertadaCourse | null
): ScheduleSlot[][] {
  if (!wouldRollbackIncompleteCorequisitoPlacement(obligation, selectedCourse)) {
    return schedule;
  }

  return pruneInvalidCorequisitoPlacements(schedule, context);
}

export function buildCorequisitoClusterBlockMessage(
  course: TurmaOfertadaCourse,
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[] = []
): string {
  const cluster = buildMutualCorequisitoCluster(course.code, context);
  const codes = cluster.filter((code) => !context.completed.has(code));

  if (codes.length >= 2) {
    const names = formatDisciplinaCodeNames(codes, catalog, context.disciplinaNames);

    return `Sem horário compatível entre ${names}. Conflito na grade impede os corequisitos.`;
  }

  return "Corequisito sem combinação de horários possível na grade simulada.";
}

export const TURMA_COREQUISITO_CLUSTER_HINT =
  "Corequisito selecionado. Aloque o horário do parceiro em seguida.";

export function isPendingMutualCorequisitoSelection(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): boolean {
  if (isTurmaPlacedOnSchedule(course, schedule)) return false;

  const scheduled = collectScheduledDisciplinaCodes(schedule);

  for (const coCode of activeCorequisitoCodes(course.code, context)) {
    if (!isMutualCorequisite(course.code, coCode, context)) continue;
    if (scheduled.has(coCode)) return true;
  }

  return false;
}
