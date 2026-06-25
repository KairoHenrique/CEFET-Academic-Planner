import { apiSuccess } from "@/lib/api/response";
import {
  parsePatchTarefaBody,
  parsePositiveIntParam,
} from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { patchTarefaConcluida } from "@/lib/disciplinas/patch-tarefa";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withDb(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const tarefaId = parsePositiveIntParam(id, "ID da tarefa");
  const body = parsePatchTarefaBody(await request.json());
  const data = patchTarefaConcluida(tarefaId, body.concluida);
  return apiSuccess(data);
});
