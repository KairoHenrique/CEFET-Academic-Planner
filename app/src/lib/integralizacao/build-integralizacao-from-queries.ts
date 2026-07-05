import { notFoundError } from "@/lib/api/errors";
import { aggregateIntegralizacaoCategories } from "@/lib/integralizacao/aggregate-categories";
import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import {
  getChCatalogForCurso,
  getIntegrationTotalHours,
} from "@/lib/integralizacao/ch-catalog";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import { readSigaaIntegralizacaoResumo } from "@/lib/integralizacao/sigaa-ch-config";
import type {
  AlunoRow,
  DisciplinaRow,
  HistoricoRow,
  IntegralizacaoRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";
import type { IntegralizacaoResponse } from "@/lib/types/integralizacao-api";

export interface IntegralizacaoQueryDeps {
  getAluno: () => Promise<AlunoRow | undefined>;
  getIntegralizacao: () => Promise<IntegralizacaoRow[]>;
  getDisciplinas: () => Promise<DisciplinaRow[]>;
  getHistorico: () => Promise<HistoricoRow[]>;
  getSemestreAtual: () => Promise<SemestreAtualWithDisciplina[]>;
  getTarefas: () => Promise<TarefaRow[]>;
}

export async function buildIntegralizacaoFromQueries(
  deps: IntegralizacaoQueryDeps
): Promise<IntegralizacaoResponse> {
  const aluno = await deps.getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const rows = await deps.getIntegralizacao();
  const catalog = getChCatalogForCurso(resolveQueryCursoId());
  const disciplinas = await deps.getDisciplinas();
  const historico = await deps.getHistorico();
  const semestreAtual = await deps.getSemestreAtual();

  const computedByType = computeChDoneFromDisciplinas(
    disciplinas,
    historico,
    semestreAtual.map((entry) => entry.disciplina_id)
  );

  const categories = aggregateIntegralizacaoCategories(
    rows,
    catalog,
    computedByType
  );

  const sigaaResumo = readSigaaIntegralizacaoResumo();
  const totalHours = sigaaResumo.totalCurriculo ?? getIntegrationTotalHours();
  const totalDoneFromCategories = categories.reduce(
    (sum, category) => sum + category.done,
    0
  );
  const totalDoneFromPercent =
    sigaaResumo.percentIntegralizado !== null
      ? Math.round((totalHours * sigaaResumo.percentIntegralizado) / 100)
      : null;
  const hasSyncedIntegralizacao = rows.some((row) => row.manual === 0);
  const totalDone = hasSyncedIntegralizacao
    ? totalDoneFromCategories
    : sigaaResumo.totalIntegralizado ?? totalDoneFromPercent ?? totalDoneFromCategories;
  const percent =
    totalHours > 0
      ? Math.round((totalDone / totalHours) * 100)
      : sigaaResumo.percentIntegralizado ?? 0;

  return {
    totalHours,
    totalDone,
    percent,
    percentSigaa: sigaaResumo.percentIntegralizado,
    categories,
  };
}
