export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { parseElegibilidadeCodesParam } from "@/lib/simulador/parse-simulador-requests";
import { buildSimuladorElegibilidade } from "@/lib/simulador/simulador-api-service";

export const GET = withDb(async (request) => {
  const url = new URL(request.url);
  const codes = parseElegibilidadeCodesParam(url.searchParams.get("codes"));
  const response = await buildSimuladorElegibilidade(codes);
  return apiSuccess(response);
});
