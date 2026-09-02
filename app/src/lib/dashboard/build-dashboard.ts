import { notFoundError } from "@/lib/api/errors";
import { resolveCurrentAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  getAluno,
  getCalendarioAcademico,
  getSemestreAtual,
  getTarefas,
} from "@/lib/db/queries";
import type { DashboardResponse } from "@/lib/types/dashboard";
import type { AcademicTask } from "@/lib/types/task";
import { buildSubjectSummary } from "@/lib/disciplinas/build-subject";
import { mapTarefaToAcademicTask } from "@/lib/disciplinas/mappers";
import { shouldHideTaskFromDashboard } from "@/lib/tasks/dates";
import {
  buildIntegralizacao,
  toIntegrationCategories,
} from "@/lib/integralizacao/build-integralizacao";

export function buildDashboard(): DashboardResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const semestreRows = getSemestreAtual();
  const disciplinas = semestreRows.map(buildSubjectSummary);
  const semestreAtualLabel = resolveCurrentAcademicSemesterLabel(
    getCalendarioAcademico()
  );

  const integralizacaoPayload = buildIntegralizacao();
  const categories = toIntegrationCategories(integralizacaoPayload);
  const { totalHours, totalDone, percent: integralizacaoPercent } =
    integralizacaoPayload;

  const activeDisciplinaIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );

  const tarefasDb = getTarefas().filter((row) =>
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

  const refeicoes =
    aluno.refeicoes_disponiveis != null &&
    Number.isFinite(Number(aluno.refeicoes_disponiveis))
      ? Number(aluno.refeicoes_disponiveis)
      : null;

  return {
    aluno: {
      matricula: aluno.matricula,
      nome: aluno.nome,
      curso: aluno.curso ?? "",
      email: aluno.email ?? "",
      semestreAtual: semestreAtualLabel,
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
    ru: {
      refeicoesDisponiveis: refeicoes,
      updatedAt: aluno.ru_synced_at ?? null,
    },
  };
}
