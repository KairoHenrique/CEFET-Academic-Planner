import { notFoundError } from "@/lib/api/errors";
import { aggregateIntegralizacaoCategories } from "@/lib/integralizacao/aggregate-categories";
import {
  getChCatalog,
  getIntegrationTotalHours,
} from "@/lib/integralizacao/ch-catalog";
import { getAluno, getIntegralizacao } from "@/lib/db/queries";
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
  const categories = aggregateIntegralizacaoCategories(rows, getChCatalog());
  const totalHours = getIntegrationTotalHours();
  const totalDone = categories.reduce((sum, category) => sum + category.done, 0);
  const percent = Math.round((totalDone / totalHours) * 100);

  return {
    totalHours,
    totalDone,
    percent,
    categories,
  };
}

export function toIntegrationCategories(
  response: IntegralizacaoResponse
): IntegrationCategory[] {
  return response.categories.map(({ label, done, total, color }) => ({
    label,
    done,
    total,
    color,
  }));
}
