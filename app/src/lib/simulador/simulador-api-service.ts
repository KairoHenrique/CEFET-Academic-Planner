import {
  buildElegibilidadeResponse,
  resolveCourseByTurmaId,
  resolveCoursesByTurmaIds,
} from "@/lib/simulador/build-elegibilidade-response";
import { buildSimulationPayload } from "@/lib/simulador/build-simulation-export";
import { buildChoquesResponse } from "@/lib/simulador/detect-grade-schedule-conflicts";
import { resolveTurmasCatalogSnapshot } from "@/lib/simulador/load-turmas-catalog-snapshot";
import type { SimuladorSimulationPayload } from "@/lib/types/simulador-api";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export async function loadSimuladorCatalog() {
  return resolveTurmasCatalogSnapshot();
}

export function resolvePlacedCourses(
  catalog: Awaited<ReturnType<typeof loadSimuladorCatalog>>,
  turmaSigaaIds: string[]
) {
  return resolveCoursesByTurmaIds(catalog, turmaSigaaIds);
}

export function resolvePayloadCourses(
  catalog: Awaited<ReturnType<typeof loadSimuladorCatalog>>,
  payload: SimuladorSimulationPayload
): TurmaOfertadaCourse[] {
  return resolveCoursesByTurmaIds(catalog, payload.turmaSigaaIds).courses;
}

export async function buildSimuladorElegibilidade(codes?: string[]) {
  const catalog = await loadSimuladorCatalog();
  return buildElegibilidadeResponse(catalog, codes);
}

export async function buildSimuladorChoques(input: {
  turmaSigaaIds: string[];
  candidateTurmaSigaaId?: string;
}) {
  const catalog = await loadSimuladorCatalog();
  const { courses, invalidTurmaIds } = resolvePlacedCourses(
    catalog,
    input.turmaSigaaIds
  );
  const candidate = input.candidateTurmaSigaaId
    ? resolveCourseByTurmaId(catalog, input.candidateTurmaSigaaId)
    : undefined;

  if (input.candidateTurmaSigaaId && !candidate) {
    invalidTurmaIds.push(input.candidateTurmaSigaaId);
  }

  return buildChoquesResponse({
    semestre: catalog.semestre,
    placements: courses,
    invalidTurmaIds,
    candidate,
  });
}

export async function buildSimulationSaveInput(input: {
  titulo: string;
  turmaSigaaIds: string[];
  semestre?: string;
}) {
  const catalog = await loadSimuladorCatalog();
  const semestre = input.semestre ?? catalog.semestre;
  const { courses, invalidTurmaIds } = resolvePlacedCourses(
    catalog,
    input.turmaSigaaIds
  );

  if (invalidTurmaIds.length > 0) {
    return { invalidTurmaIds, semestre, courses, payload: null };
  }

  return {
    invalidTurmaIds,
    semestre,
    courses,
    payload: buildSimulationPayload({
      semestre,
      turmaSigaaIds: courses.map((course) => course.turmaSigaaId),
    }),
  };
}
