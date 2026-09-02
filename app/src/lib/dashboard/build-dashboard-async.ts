import {
  buildIntegralizacaoFromQueries,
  type IntegralizacaoQueryDeps,
} from "@/lib/integralizacao/build-integralizacao-from-queries";
import { resolveCurrentAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { notFoundError } from "@/lib/api/errors";
import type { DashboardResponse } from "@/lib/types/dashboard";
import type { AcademicTask } from "@/lib/types/task";
import type { CalendarioAcademicoRow } from "@/lib/types/db";
import { buildSubjectSummary, buildSubjectSummaryCore } from "@/lib/disciplinas/build-subject";
import { SubjectSourceIndex } from "@/lib/disciplinas/build-subject-source";
import { mapTarefaToAcademicTask } from "@/lib/disciplinas/mappers";
import { shouldHideTaskFromDashboard } from "@/lib/tasks/dates";
import { toIntegrationCategories } from "@/lib/integralizacao/build-integralizacao";

export type DashboardQueryDeps = IntegralizacaoQueryDeps & {
  /** Datas oficiais do calendário — define Semestre X.Y no header. */
  getCalendarioAcademico?: () => Promise<CalendarioAcademicoRow[]>;
};

export async function buildDashboardFromQueries(
  deps: DashboardQueryDeps
): Promise<DashboardResponse> {
  const aluno = await deps.getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const [semestreRows, allTarefas, academicRows] = await Promise.all([
    deps.getSemestreAtual(),
    deps.getTarefas(),
    deps.getCalendarioAcademico?.() ?? Promise.resolve([]),
  ]);
  const semestreAtualLabel = resolveCurrentAcademicSemesterLabel(academicRows);

  // Bulk (cloud/postgres): monta o índice de notas/faltas/tarefas 1x e resolve
  // cada card em O(1). Fallback SQLite (dev/PC) usa `buildSubjectSummary`.
  let disciplinas;
  if (deps.getAllNotas && deps.getAllFaltas) {
    const [notas, faltas] = await Promise.all([
      deps.getAllNotas(),
      deps.getAllFaltas(),
    ]);
    const index = new SubjectSourceIndex(notas, faltas, allTarefas);
    disciplinas = semestreRows.map((semestre) =>
      buildSubjectSummaryCore(semestre, index.resolve(semestre.disciplina_id))
    );
  } else {
    disciplinas = semestreRows.map(buildSubjectSummary);
  }

  const integralizacaoPayload = await buildIntegralizacaoFromQueries(deps);
  const categories = toIntegrationCategories(integralizacaoPayload);
  const { totalHours, totalDone, percent: integralizacaoPercent } =
    integralizacaoPayload;

  const activeDisciplinaIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );

  const tarefasDb = allTarefas.filter((row) =>
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
