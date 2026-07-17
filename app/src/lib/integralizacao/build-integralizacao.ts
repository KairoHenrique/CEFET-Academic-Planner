import { notFoundError } from "@/lib/api/errors";
import { aggregateIntegralizacaoCategories } from "@/lib/integralizacao/aggregate-categories";
import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import {
  getChCatalog,
  getIntegrationTotalHours,
} from "@/lib/integralizacao/ch-catalog";
import { readSigaaIntegralizacaoResumo } from "@/lib/integralizacao/sigaa-ch-config";
import {
  getAluno,
  getDisciplinas,
  getHistorico,
  getIntegralizacao,
  getSemestreAtual,
} from "@/lib/db/queries";
import type { IntegralizacaoResponse } from "@/lib/types/integralizacao-api";
import type { IntegrationCategory } from "@/lib/types/integration";

export function buildIntegralizacao(): IntegralizacaoResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const rows = getIntegralizacao();
  const catalog = getChCatalog();
  const disciplinas = getDisciplinas();
  const historico = getHistorico();
  const semestreAtual = getSemestreAtual();

  const computedByType = computeChDoneFromDisciplinas(
    disciplinas,
    historico,
    semestreAtual.map((entry) => entry.disciplina_id)
  );

  const sigaaResumo = readSigaaIntegralizacaoResumo();

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

export function toIntegrationCategories(
  response: IntegralizacaoResponse
): IntegrationCategory[] {
  return response.categories.map(({ label, done, total, pending, color }) => ({
    label,
    done,
    total,
    pending,
    color,
  }));
}
