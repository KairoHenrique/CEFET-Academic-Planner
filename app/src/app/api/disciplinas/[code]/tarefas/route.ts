import { apiSuccess } from "@/lib/api/response";
import { parseCreateTarefaBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { createDisciplinaTarefa } from "@/lib/disciplinas/create-disciplina-tarefa";

type RouteContext = { params: Promise<{ code: string }> };

export const POST = withDb(async (request, context: RouteContext) => {
  const { code } = await context.params;
  const body = parseCreateTarefaBody(await request.json());
  const data = createDisciplinaTarefa(decodeURIComponent(code), body);
  return apiSuccess(data);
});
