export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchDisciplinaAppearanceBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { patchDisciplinaAppearance } from "@/lib/disciplinas/patch-disciplina-appearance";

type RouteContext = { params: Promise<{ code: string }> };

export const PATCH = withDb(async (request, context: RouteContext) => {
  const { code } = await context.params;
  const body = parsePatchDisciplinaAppearanceBody(await request.json());
  const data = await patchDisciplinaAppearance(decodeURIComponent(code), body);
  return apiSuccess(data);
});
