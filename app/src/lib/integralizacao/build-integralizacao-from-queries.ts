import { notFoundError } from "@/lib/api/errors";
import { aggregateIntegralizacaoCategories } from "@/lib/integralizacao/aggregate-categories";
import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import {
  getChCatalogForCurso,
  getIntegrationTotalHours,
} from "@/lib/integralizacao/ch-catalog";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import {
  readSigaaIntegralizacaoResumo,
  type SigaaIntegralizacaoResumo,
} from "@/lib/integralizacao/sigaa-ch-config";
import type {
  AlunoRow,
  DisciplinaRow,
  FaltaRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
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
  /**
   * Leitor do resumo `sigaa.ch.*`. Ausente = fallback SQLite (`getConfig`);
   * no cloud/postgres é injetado para ler da tabela `configuracoes`.
   */
  getSigaaResumo?: () => Promise<SigaaIntegralizacaoResumo>;
  /**
   * Notas/faltas em lote (bulk) — usados pelo dashboard para montar os cards de
   * disciplina sem N+1 nem acoplamento ao SQLite. Ausentes = fallback SQLite.
   */
  getAllNotas?: () => Promise<NotaRow[]>;
  getAllFaltas?: () => Promise<FaltaRow[]>;
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

  const sigaaResumo = deps.getSigaaResumo
    ? await deps.getSigaaResumo()
    : readSigaaIntegralizacaoResumo();

  const categories = aggregateIntegralizacaoCategories(
    rows,
    catalog,
    computedByType,
    sigaaResumo.fromHistoricoPdf ?? false
  );

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
