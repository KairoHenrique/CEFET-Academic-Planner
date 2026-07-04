import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

const MAX_ITERATIONS = 12;

function isVisibleInSimulador(course: TurmaOfertadaCourse): boolean {
  return course.status === "unlocked" || course.status === "conditional";
}

function activeCorequisitoCodes(course: TurmaOfertadaCourse): string[] {
  const waived = new Set(
    course.waivedCoRequisitoCodes.map((code) => normalizeDisciplinaCode(code))
  );

  return course.coRequisitoCodes.filter(
    (code) => !waived.has(normalizeDisciplinaCode(code))
  );
}

function lockCourse(course: TurmaOfertadaCourse): TurmaOfertadaCourse {
  return {
    ...course,
    status: "locked",
    pendingPrereqCodes: [],
    prerequisiteHint: null,
  };
}

/**
 * Remove turmas cujo par de corequisito não está ofertado/elegível no mesmo semestre.
 * Converge em poucas passagens quando pares se bloqueiam mutuamente.
 */
export function applyCorequisitoOfferGate(
  courses: TurmaOfertadaCourse[]
): TurmaOfertadaCourse[] {
  let result = courses;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const visibleCodes = new Set(
      result.filter(isVisibleInSimulador).map((course) => normalizeDisciplinaCode(course.code))
    );

    let changed = false;
    const next = result.map((course) => {
      if (!isVisibleInSimulador(course)) return course;

      const missingPartner = activeCorequisitoCodes(course).some(
        (code) => !visibleCodes.has(normalizeDisciplinaCode(code))
      );

      if (!missingPartner) return course;

      changed = true;
      return lockCourse(course);
    });

    result = next;
    if (!changed) break;
  }

  return result;
}
