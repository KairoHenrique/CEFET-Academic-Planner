import {
  buildMutualCorequisitoCluster,
  isMutualCorequisitoPartnerScheduleLocked,
} from "@/lib/simulador/corequisito-cluster-viability";
import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import {
  isMutualCorequisite,
  resolveCoRequisitosForDisciplina,
  type SimuladorPlacementContext,
} from "@/lib/simulador/corequisito-schedule-policy";
import {
  isTurmaScheduleLocked,
  resolveTurmaBlockingCellKeys,
} from "@/lib/simulador/turma-schedule-placement";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

/** Duração do flash vermelho na grade ao clicar turma trancada (ms). */
export const ENROLLMENT_BLOCKING_FLASH_MS = 750;

function hasActiveMutualCorequisito(
  course: TurmaOfertadaCourse,
  context: SimuladorPlacementContext
): boolean {
  return resolveCoRequisitosForDisciplina(course.code, context).some(
    (coCode) =>
      isMutualCorequisite(course.code, coCode, context) &&
      !context.completed.has(coCode)
  );
}

/** Contorno dourado: coreq trancado pelo parceiro ou par com conflito direto. */
export function resolveCourseCoreqLockHighlight(
  course: TurmaOfertadaCourse,
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext,
  catalog: TurmaOfertadaCourse[]
): boolean {
  if (
    isMutualCorequisitoPartnerScheduleLocked(
      course,
      schedule,
      context,
      catalog
    )
  ) {
    return true;
  }

  return (
    isTurmaScheduleLocked(course, schedule) &&
    hasActiveMutualCorequisito(course, context)
  );
}

/** Células da grade em conflito — só ao selecionar turma trancada (aviso vermelho suave). */
export function resolveSelectedLockedCourseBlockingCellKeys(
  selectedCourse: TurmaOfertadaCourse | null,
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): ReadonlySet<string> {
  if (!selectedCourse) return new Set();

  const directLocked = isTurmaScheduleLocked(selectedCourse, schedule);
  const partnerLocked = isMutualCorequisitoPartnerScheduleLocked(
    selectedCourse,
    schedule,
    context,
    catalog
  );

  if (!directLocked && !partnerLocked) return new Set();

  if (directLocked) {
    return resolveTurmaBlockingCellKeys(selectedCourse, schedule);
  }

  const cluster = buildMutualCorequisitoCluster(selectedCourse.code, context);
  const selfCode = normalizeDisciplinaCode(selectedCourse.code);
  const keys = new Set<string>();

  for (const partnerCode of cluster) {
    if (partnerCode === selfCode || context.completed.has(partnerCode)) continue;

    for (const variant of catalog) {
      if (normalizeDisciplinaCode(variant.code) !== partnerCode) continue;
      if (!isTurmaScheduleLocked(variant, schedule)) continue;

      for (const key of resolveTurmaBlockingCellKeys(variant, schedule)) {
        keys.add(key);
      }
    }
  }

  return keys;
}
