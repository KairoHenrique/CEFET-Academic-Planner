export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchNotasBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { patchDisciplinaNotas } from "@/lib/disciplinas/patch-disciplina-notas";

type RouteContext = { params: Promise<{ code: string }> };

export const PATCH = withDb(async (request, context: RouteContext) => {
  const { code } = await context.params;
  const body = parsePatchNotasBody(await request.json());
  const data = patchDisciplinaNotas(decodeURIComponent(code), body);
  return apiSuccess(data);
});
