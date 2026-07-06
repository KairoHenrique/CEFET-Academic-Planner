export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { parseSimulationIdParam } from "@/lib/simulador/parse-simulador-requests";
import {
  getSavedSimulation,
  removeSavedSimulation,
} from "@/lib/simulador/simulation-repository";
import {
  loadSimuladorCatalog,
  resolvePayloadCourses,
} from "@/lib/simulador/simulador-api-service";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withDb(async (_request, context: RouteContext) => {
  const { id: rawId } = await context.params;
  const id = parseSimulationIdParam(rawId);
  const simulation = await getSavedSimulation(id, async (payload) => {
    const catalog = await loadSimuladorCatalog();
    return resolvePayloadCourses(catalog, payload);
  });
  return apiSuccess({ ok: true as const, simulation });
});

export const DELETE = withDb(async (_request, context: RouteContext) => {
  const { id: rawId } = await context.params;
  const id = parseSimulationIdParam(rawId);
  await removeSavedSimulation(id);
  return apiSuccess({ ok: true as const, deleted: true });
});
