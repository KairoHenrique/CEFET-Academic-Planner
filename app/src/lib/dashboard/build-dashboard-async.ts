import {
  buildIntegralizacaoFromQueries,
  type IntegralizacaoQueryDeps,
} from "@/lib/integralizacao/build-integralizacao-from-queries";
import { notFoundError } from "@/lib/api/errors";
import type { DashboardResponse } from "@/lib/types/dashboard";
import type { AcademicTask } from "@/lib/types/task";
import { buildSubjectSummary } from "@/lib/disciplinas/build-subject";
import { mapTarefaToAcademicTask } from "@/lib/disciplinas/mappers";
import { shouldHideTaskFromDashboard } from "@/lib/tasks/dates";
import { toIntegrationCategories } from "@/lib/integralizacao/build-integralizacao";

export async function buildDashboardFromQueries(
  deps: IntegralizacaoQueryDeps
): Promise<DashboardResponse> {
  const aluno = await deps.getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const semestreRows = await deps.getSemestreAtual();
  const disciplinas = semestreRows.map(buildSubjectSummary);

  const integralizacaoPayload = await buildIntegralizacaoFromQueries(deps);
  const categories = toIntegrationCategories(integralizacaoPayload);
  const { totalHours, totalDone, percent: integralizacaoPercent } =
    integralizacaoPayload;

  const activeDisciplinaIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );

  const tarefasDb = (await deps.getTarefas()).filter((row) =>
    activeDisciplinaIds.has(row.disciplina_id.toLowerCase())
  );
  const colorByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.cor ?? "#3AA0E8"])
  );
  const nameByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.nome])
  );

  const tarefas: AcademicTask[] = tarefasDb
    .map((row) =>
      mapTarefaToAcademicTask(
        { ...row, disciplina_nome: nameByCode.get(row.disciplina_id) },
        colorByCode.get(row.disciplina_id) ?? "#3AA0E8"
      )
    )
    .filter((task) => !shouldHideTaskFromDashboard(task))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.dueDateIso.localeCompare(b.dueDateIso);
    });

  const tarefasPendentes = tarefas.filter((task) => !task.done).length;

  return {
    aluno: {
      matricula: aluno.matricula,
      nome: aluno.nome,
      curso: aluno.curso ?? "",
      email: aluno.email ?? "",
      semestreAtual: "2026.1",
      rg: aluno.rg ?? 0,
      status: aluno.status ?? "",
    },
    stats: {
      rg: aluno.rg ?? 0,
      integralizacaoPercent,
      disciplinasCursando: disciplinas.length,
      tarefasPendentes,
    },
    integralizacao: {
      totalHours,
      totalDone,
      percent: integralizacaoPercent,
      categories,
    },
    tarefas,
    disciplinas,
  };
}
