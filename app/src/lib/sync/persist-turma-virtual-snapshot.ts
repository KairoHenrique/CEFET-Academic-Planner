import {
  normalizeDisciplinaNome,
  resolveDisciplinaCodigoByNome,
  resolveDisciplinaCodigoFromSemestre,
} from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import { stripSemestreSuffix } from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import {
  clearTurmaVirtualSyncedData,
  getSemestreAtual,
  patchSyncedSemestreTurmaMetadata,
  replaceSyncedGrupoForDisciplina,
  upsertSyncedFalta,
  upsertSyncedNota,
  upsertSyncedTarefa,
} from "@/lib/db/queries";
import { isAtividadePrazoVencido } from "@/lib/tasks/dates";
import type { TurmaVirtualSnapshot } from "@/lib/scraper/types/turma-virtual";

function buildSemestreCodigoByNome(): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of getSemestreAtual()) {
    map.set(normalizeDisciplinaNome(row.nome), row.disciplina_id);
    if (row.apelido?.trim()) {
      map.set(normalizeDisciplinaNome(row.apelido), row.disciplina_id);
    }
  }

  return map;
}

function buildActiveDisciplinaIds(): Set<string> {
  return new Set(getSemestreAtual().map((row) => row.disciplina_id));
}

function resolveDisciplinaId(
  sigaaNome: string,
  semestreByNome: Map<string, string>,
  activeIds: Set<string>
): string | null {
  const fromSemestre = resolveDisciplinaCodigoFromSemestre(
    sigaaNome,
    semestreByNome,
    activeIds
  );
  if (fromSemestre) return fromSemestre;

  const fallback = resolveDisciplinaCodigoByNome(sigaaNome);
  return activeIds.has(fallback) ? fallback : null;
}

export function persistTurmaVirtualSnapshot(snapshot: TurmaVirtualSnapshot): void {
  clearTurmaVirtualSyncedData();

  const semestreByNome = buildSemestreCodigoByNome();
  const activeIds = buildActiveDisciplinaIds();

  for (const disciplina of snapshot.disciplinas) {
    const sigaaRef = stripSemestreSuffix(disciplina.sigaaNome);
    const disciplinaId = resolveDisciplinaId(
      sigaaRef,
      semestreByNome,
      activeIds
    );
    if (!disciplinaId) continue;

    if (disciplina.professor || disciplina.maxFaltas !== null) {
      patchSyncedSemestreTurmaMetadata(disciplinaId, {
        professor: disciplina.professor,
        max_faltas: disciplina.maxFaltas,
      });
    }

    for (const nota of disciplina.notas) {
      upsertSyncedNota({
        disciplina_id: disciplinaId,
        avaliacao_nome: nota.avaliacaoNome,
        nota_maxima: nota.notaMaxima,
        nota_obtida: nota.notaObtida,
        manual: 0,
      });
    }

    for (const falta of disciplina.faltas) {
      upsertSyncedFalta({
        disciplina_id: disciplinaId,
        data: falta.data,
        status: falta.status,
      });
    }

    replaceSyncedGrupoForDisciplina(
      disciplinaId,
      disciplina.grupo.map((membro) => ({
        nome: membro.nome,
        matricula: membro.matricula,
        email: membro.email,
        curso: membro.curso,
      }))
    );

    for (const tarefa of disciplina.tarefas) {
      if (
        tarefa.dataFim &&
        isAtividadePrazoVencido(tarefa.dataFim, tarefa.horaFim)
      ) {
        continue;
      }

      upsertSyncedTarefa({
        disciplina_id: disciplinaId,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        data_inicio: tarefa.dataInicio,
        data_fim: tarefa.dataFim,
        hora_fim: tarefa.horaFim ?? "23:59",
        tipo: tarefa.tipo,
        possui_nota: tarefa.possuiNota ? 1 : 0,
        concluida: 0,
        manual: 0,
        instrucoes:
          tarefa.instrucoes.length > 0
            ? JSON.stringify(tarefa.instrucoes)
            : null,
        entregaveis:
          tarefa.entregaveis.length > 0
            ? JSON.stringify(tarefa.entregaveis)
            : null,
        pontuacao_maxima: tarefa.pontuacaoMaxima,
      });
    }
  }
}
