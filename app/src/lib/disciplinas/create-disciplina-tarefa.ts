import { notFoundError, validationError } from "@/lib/api/errors";
import {
  deleteTarefa,
  getSemestreAtualByCodigo,
  getTarefaById,
  getTarefasByDisciplina,
  saveTarefa,
  updateTarefaFields,
} from "@/lib/db/queries";
import type { CreateTarefaBody } from "@/lib/types/disciplinas-api";
import { mapTarefaToAcademicTask } from "./mappers";

export function createDisciplinaTarefa(
  code: string,
  body: CreateTarefaBody
): ReturnType<typeof mapTarefaToAcademicTask> {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const titulo = body.titulo.trim();
  if (!titulo) {
    throw validationError("Título da tarefa é obrigatório.");
  }
  if (!body.data_fim) {
    throw validationError("Data de entrega é obrigatória.");
  }

  saveTarefa({
    disciplina_id: semestre.disciplina_id,
    titulo,
    descricao: body.descricao?.trim() ?? "",
    data_inicio: null,
    data_fim: body.data_fim,
    hora_fim: body.hora_fim ?? "23:59",
    tipo: body.tipo ?? "individual",
    possui_nota: body.possui_nota ? 1 : 0,
    concluida: 0,
    manual: 1,
    instrucoes: JSON.stringify(body.instrucoes ?? []),
    entregaveis: JSON.stringify(body.entregaveis ?? []),
    pontuacao_maxima: body.pontuacao_maxima ?? null,
  });

  const rows = getTarefasByDisciplina(semestre.disciplina_id);
  const created = rows[rows.length - 1];
  if (!created) {
    throw validationError("Não foi possível criar a tarefa.");
  }

  return mapTarefaToAcademicTask(
    { ...created, disciplina_nome: semestre.nome },
    semestre.cor ?? "#3AA0E8"
  );
}
