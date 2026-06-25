import { notFoundError } from "@/lib/api/errors";
import { getTarefaById, updateTarefaConcluida } from "@/lib/db/queries";

export function patchTarefaConcluida(
  id: number,
  concluida: boolean
): { id: number; concluida: boolean } {
  const tarefa = getTarefaById(id);
  if (!tarefa) {
    throw notFoundError("Tarefa não encontrada.");
  }

  updateTarefaConcluida(id, concluida);
  return { id, concluida };
}
