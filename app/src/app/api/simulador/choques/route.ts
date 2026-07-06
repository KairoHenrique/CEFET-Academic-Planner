export const dynamic = "force-dynamic";

import { validationError } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { parseChoquesRequestBody } from "@/lib/simulador/parse-simulador-requests";
import { buildSimuladorChoques } from "@/lib/simulador/simulador-api-service";

export const POST = withDb(async (request) => {
  const body = parseChoquesRequestBody(await request.json());
  const response = await buildSimuladorChoques(body);

  if (response.invalidTurmaIds.length > 0) {
    throw validationError(
      `Turmas não encontradas no catálogo: ${response.invalidTurmaIds.join(", ")}`
    );
  }

  return apiSuccess(response);
});
