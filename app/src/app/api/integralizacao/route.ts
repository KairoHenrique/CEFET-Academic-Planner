export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePostIntegralizacaoBody } from "@/lib/api/validate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withDb } from "@/lib/api/with-db";
import { buildIntegralizacao } from "@/lib/integralizacao/build-integralizacao";
import { buildIntegralizacaoFromQueries } from "@/lib/integralizacao/build-integralizacao-from-queries";
import { registerManualIntegralizacaoHours } from "@/lib/integralizacao/register-manual-hours";
import { postgresQueryDeps } from "@/lib/db/postgres/query-port";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const integralizacao = await buildIntegralizacaoFromQueries(postgresQueryDeps);
    return apiSuccess(integralizacao);
  }

  const integralizacao = buildIntegralizacao();
  return apiSuccess(integralizacao);
});

export const POST = withDb(async (request) => {
  const body = parsePostIntegralizacaoBody(await request.json());
  const integralizacao = registerManualIntegralizacaoHours(body);
  return apiSuccess(integralizacao, 201);
});
