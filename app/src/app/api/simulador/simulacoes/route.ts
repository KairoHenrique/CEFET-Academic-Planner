export const dynamic = "force-dynamic";

import { validationError } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { parseSaveSimulationBody } from "@/lib/simulador/parse-simulador-requests";
import {
  listSavedSimulations,
  saveSimulation,
} from "@/lib/simulador/simulation-repository";
import {
  buildSimulationSaveInput,
  loadSimuladorCatalog,
  resolvePayloadCourses,
} from "@/lib/simulador/simulador-api-service";

async function resolveCoursesFromPayload(
  payload: Parameters<typeof resolvePayloadCourses>[1]
) {
  const catalog = await loadSimuladorCatalog();
  return resolvePayloadCourses(catalog, payload);
}

export const GET = withDb(async () => {
  const items = await listSavedSimulations(resolveCoursesFromPayload);
  return apiSuccess({ ok: true as const, items });
});

export const POST = withDb(async (request) => {
  const body = parseSaveSimulationBody(await request.json());
  const prepared = await buildSimulationSaveInput(body);

  if (!prepared.payload || prepared.invalidTurmaIds.length > 0) {
    throw validationError(
      `Turmas não encontradas no catálogo: ${prepared.invalidTurmaIds.join(", ")}`
    );
  }

  const simulation = await saveSimulation({
    titulo: body.titulo,
    semestre: prepared.semestre,
    payload: prepared.payload,
    courses: prepared.courses,
  });

  return apiSuccess({ ok: true as const, simulation }, 201);
});
