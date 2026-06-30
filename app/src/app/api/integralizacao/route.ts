export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePostIntegralizacaoBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { buildIntegralizacao } from "@/lib/integralizacao/build-integralizacao";
import { registerManualIntegralizacaoHours } from "@/lib/integralizacao/register-manual-hours";

export const GET = withDb(async () => {
  const integralizacao = buildIntegralizacao();
  return apiSuccess(integralizacao);
});

export const POST = withDb(async (request) => {
  const body = parsePostIntegralizacaoBody(await request.json());
  const integralizacao = registerManualIntegralizacaoHours(body);
  return apiSuccess(integralizacao, 201);
});
