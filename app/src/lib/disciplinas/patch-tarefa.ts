import { notFoundError, validationError } from "@/lib/api/errors";
import {
  mDeleteTarefa,
  mGetTarefaById,
  mUpdateTarefaConcluida,
  mUpdateTarefaFields,
} from "@/lib/db/mutations/mutation-ports";
import type { PatchTarefaBody } from "@/lib/types/disciplinas-api";

export async function patchTarefa(id: number, body: PatchTarefaBody) {
  const tarefa = await mGetTarefaById(id);
  if (!tarefa) {
    throw notFoundError("Tarefa não encontrada.");
  }

  if (body.action === "toggle") {
    await mUpdateTarefaConcluida(id, body.concluida);
    return { id, concluida: body.concluida };
  }

  if (body.action === "delete") {
    if (tarefa.manual !== 1) {
      throw validationError("Apenas tarefas manuais podem ser excluídas.");
    }
    const changes = await mDeleteTarefa(id);
    if (changes === 0) {
      throw validationError("Não foi possível excluir a tarefa.");
    }
    return { id, deleted: true };
  }

  const titulo = body.titulo?.trim();
  if (body.titulo !== undefined && !titulo) {
    throw validationError("Título da tarefa é obrigatório.");
  }

  const changes = await mUpdateTarefaFields(id, {
    titulo,
    descricao: body.descricao?.trim(),
    data_fim: body.data_fim,
    hora_fim: body.hora_fim,
    tipo: body.tipo,
    possui_nota:
      body.possui_nota === undefined ? undefined : body.possui_nota ? 1 : 0,
    concluida:
      body.concluida === undefined ? undefined : body.concluida ? 1 : 0,
    pontuacao_maxima: body.pontuacao_maxima,
  });

  if (changes === 0) {
    throw validationError("Nenhuma alteração informada.");
  }

  return { id, updated: true };
}

// Backward-compatible export
export function patchTarefaConcluida(id: number, concluida: boolean) {
  return patchTarefa(id, { action: "toggle", concluida });
}
