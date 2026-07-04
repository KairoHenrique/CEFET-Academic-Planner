import { evaluateChGateForDisciplina } from "@/lib/mapa/period-ch-gates";
import {
  compareHistoricoSemestre,
  normalizeDisciplinaCode,
  type CourseMapStatusContext,
} from "@/lib/mapa/course-status";
import type { DisciplinaRow } from "@/lib/types/db";

export type EnrollmentEligibility = "ready" | "conditional" | "hidden";

export interface EnrollmentEligibilityResult {
  eligibility: EnrollmentEligibility;
  pendingPrereqCodes: string[];
}

export interface EnrollmentEligibilityContext
  extends Pick<
    CourseMapStatusContext,
    | "completed"
    | "current"
    | "preRequisitos"
    | "obrigatoriaDone"
    | "obrigatoriaTotal"
  > {
  failed: Set<string>;
  coRequisitos: Map<string, string[]>;
  disciplinas: DisciplinaRow[];
}

function findDisciplinaByCode(
  code: string,
  disciplinas: DisciplinaRow[]
): DisciplinaRow | undefined {
  const normalized = normalizeDisciplinaCode(code);
  return disciplinas.find(
    (item) => normalizeDisciplinaCode(item.codigo) === normalized
  );
}

function passesChGate(
  disciplina: DisciplinaRow,
  obrigatoriaDone: number,
  obrigatoriaTotal: number
): boolean {
  return evaluateChGateForDisciplina(
    disciplina,
    obrigatoriaDone,
    obrigatoriaTotal
  ).allowed;
}

function resolvePrerequisiteEligibility(
  disciplina: DisciplinaRow | undefined,
  codigo: string,
  context: Pick<
    EnrollmentEligibilityContext,
    | "completed"
    | "current"
    | "failed"
    | "preRequisitos"
    | "obrigatoriaDone"
    | "obrigatoriaTotal"
  >
): EnrollmentEligibilityResult {
  const code = normalizeDisciplinaCode(codigo);

  if (context.completed.has(code)) {
    return { eligibility: "hidden", pendingPrereqCodes: [] };
  }

  if (context.current.has(code)) {
    return { eligibility: "hidden", pendingPrereqCodes: [] };
  }

  if (!disciplina) {
    return { eligibility: "ready", pendingPrereqCodes: [] };
  }

  const required = context.preRequisitos.get(code) ?? [];
  const pendingInProgress: string[] = [];

  for (const prereqCode of required) {
    if (context.completed.has(prereqCode)) continue;

    if (context.failed.has(prereqCode)) {
      return { eligibility: "hidden", pendingPrereqCodes: [] };
    }

    if (context.current.has(prereqCode)) {
      pendingInProgress.push(prereqCode);
      continue;
    }

    return { eligibility: "hidden", pendingPrereqCodes: [] };
  }

  if (
    !passesChGate(
      disciplina,
      context.obrigatoriaDone,
      context.obrigatoriaTotal
    )
  ) {
    return { eligibility: "hidden", pendingPrereqCodes: [] };
  }

  if (pendingInProgress.length > 0) {
    return {
      eligibility: "conditional",
      pendingPrereqCodes: pendingInProgress.sort((left, right) =>
        compareHistoricoSemestre(left, right)
      ),
    };
  }

  return { eligibility: "ready", pendingPrereqCodes: [] };
}

function mergePendingPrereqCodes(codes: string[]): string[] {
  return [...new Set(codes.map(normalizeDisciplinaCode))].sort((left, right) =>
    compareHistoricoSemestre(left, right)
  );
}

/** Corequisito ativo ainda não concluído no histórico. */
function listActiveCorequisitoCodes(
  code: string,
  context: Pick<EnrollmentEligibilityContext, "completed" | "coRequisitos">
): string[] {
  const normalized = normalizeDisciplinaCode(code);
  const all = context.coRequisitos.get(normalized) ?? [];
  return all.filter((item) => !context.completed.has(item));
}

interface CorequisitoEligibilityImpact {
  blocked: boolean;
  pendingPrereqCodes: string[];
}

function resolveCorequisitoEligibilityImpact(
  code: string,
  context: EnrollmentEligibilityContext,
  visiting: Set<string>
): CorequisitoEligibilityImpact {
  const normalized = normalizeDisciplinaCode(code);
  if (visiting.has(normalized)) {
    return { blocked: false, pendingPrereqCodes: [] };
  }

  visiting.add(normalized);

  const pending: string[] = [];
  for (const coCode of listActiveCorequisitoCodes(normalized, context)) {
    const coDisciplina = findDisciplinaByCode(coCode, context.disciplinas);
    const coResult = resolvePrerequisiteEligibility(
      coDisciplina,
      coCode,
      context
    );

    if (coResult.eligibility === "hidden") {
      visiting.delete(normalized);
      return { blocked: true, pendingPrereqCodes: [] };
    }

    if (coResult.eligibility === "conditional") {
      pending.push(...coResult.pendingPrereqCodes);
    }

    const nested = resolveCorequisitoEligibilityImpact(coCode, context, visiting);
    if (nested.blocked) {
      visiting.delete(normalized);
      return { blocked: true, pendingPrereqCodes: [] };
    }

    pending.push(...nested.pendingPrereqCodes);
  }

  visiting.delete(normalized);
  return {
    blocked: false,
    pendingPrereqCodes: mergePendingPrereqCodes(pending),
  };
}

export function resolveEnrollmentEligibility(
  disciplina: DisciplinaRow | undefined,
  codigo: string,
  context: EnrollmentEligibilityContext
): EnrollmentEligibilityResult {
  const base = resolvePrerequisiteEligibility(disciplina, codigo, context);
  if (base.eligibility === "hidden") {
    return base;
  }

  const coreqImpact = resolveCorequisitoEligibilityImpact(
    codigo,
    context,
    new Set()
  );
  if (coreqImpact.blocked) {
    return { eligibility: "hidden", pendingPrereqCodes: [] };
  }

  const mergedPending = mergePendingPrereqCodes([
    ...base.pendingPrereqCodes,
    ...coreqImpact.pendingPrereqCodes,
  ]);

  if (mergedPending.length > 0) {
    return {
      eligibility: "conditional",
      pendingPrereqCodes: mergedPending,
    };
  }

  return base;
}
