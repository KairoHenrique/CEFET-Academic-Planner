import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import type {
  SimuladorElegibilidadeItem,
  SimuladorElegibilidadeResponse,
} from "@/lib/types/simulador-api";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";
import type { TurmasCatalogSnapshot } from "@/lib/simulador/load-turmas-catalog-snapshot";

const REASON_BY_STATUS: Record<
  TurmaOfertadaCourse["status"],
  string | null
> = {
  done: "Disciplina já concluída no histórico.",
  locked: "Pré-requisitos ou travas de CH não atendidos.",
  conditional:
    "Pré-requisito em andamento no semestre atual — matrícula condicional.",
  unlocked: null,
};

function resolveElegibilidadeItem(
  course: TurmaOfertadaCourse
): SimuladorElegibilidadeItem {
  const canEnroll =
    course.status === "unlocked" || course.status === "conditional";

  return {
    code: normalizeDisciplinaCode(course.code),
    name: course.name,
    canEnroll,
    status: course.status,
    pendingPrereqCodes: course.pendingPrereqCodes,
    reason: REASON_BY_STATUS[course.status],
  };
}

export function buildElegibilidadeResponse(
  catalog: TurmasCatalogSnapshot,
  filterCodes?: string[]
): SimuladorElegibilidadeResponse {
  const filter =
    filterCodes && filterCodes.length > 0
      ? new Set(filterCodes.map(normalizeDisciplinaCode))
      : null;

  const seen = new Set<string>();
  const items: SimuladorElegibilidadeItem[] = [];

  for (const course of catalog.courses) {
    const code = normalizeDisciplinaCode(course.code);
    if (filter && !filter.has(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    items.push(resolveElegibilidadeItem(course));
  }

  items.sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));

  return {
    ok: true,
    semestre: catalog.semestre,
    items,
  };
}

export function resolveCourseByTurmaId(
  catalog: TurmasCatalogSnapshot,
  turmaSigaaId: string
): TurmaOfertadaCourse | undefined {
  const normalized = turmaSigaaId.trim();
  return catalog.courses.find((course) => course.turmaSigaaId === normalized);
}

export function resolveCoursesByTurmaIds(
  catalog: TurmasCatalogSnapshot,
  turmaSigaaIds: string[]
): { courses: TurmaOfertadaCourse[]; invalidTurmaIds: string[] } {
  const uniqueIds = [...new Set(turmaSigaaIds.map((id) => id.trim()).filter(Boolean))];
  const courses: TurmaOfertadaCourse[] = [];
  const invalidTurmaIds: string[] = [];

  for (const turmaSigaaId of uniqueIds) {
    const course = resolveCourseByTurmaId(catalog, turmaSigaaId);
    if (!course) {
      invalidTurmaIds.push(turmaSigaaId);
      continue;
    }
    courses.push(course);
  }

  return { courses, invalidTurmaIds };
}
