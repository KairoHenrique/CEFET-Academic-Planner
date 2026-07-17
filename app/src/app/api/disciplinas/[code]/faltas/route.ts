export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchFaltaBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { patchDisciplinaFalta } from "@/lib/disciplinas/patch-disciplina-faltas";

type RouteContext = { params: Promise<{ code: string }> };

export const PATCH = withDb(async (request, context: RouteContext) => {
  const { code } = await context.params;
  const body = parsePatchFaltaBody(await request.json());
  const data = await patchDisciplinaFalta(decodeURIComponent(code), body);
  return apiSuccess(data);
});
