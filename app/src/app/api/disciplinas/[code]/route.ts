export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildDisciplinaDetail } from "@/lib/disciplinas/build-disciplina-detail";

type RouteContext = { params: Promise<{ code: string }> };

export const GET = withDb(async (_request, context: RouteContext) => {
  const { code } = await context.params;
  const data = buildDisciplinaDetail(decodeURIComponent(code));
  return apiSuccess(data);
});
