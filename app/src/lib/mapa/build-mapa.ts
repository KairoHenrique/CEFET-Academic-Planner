import { notFoundError } from "@/lib/api/errors";
import {
  getAluno,
  getDisciplinas,
  getHistorico,
  getRequisitos,
  getSemestreAtual,
} from "@/lib/db/queries";
import {
  buildCompletedDisciplinaSet,
  buildCurrentDisciplinaSet,
  buildPreRequisitoMap,
  countStatusTotals,
  resolveCourseMapStatus,
} from "@/lib/mapa/course-status";
import type { DisciplinaRow } from "@/lib/types/db";
import type {
  CourseMapNode,
  CourseMapPeriod,
  MapaResponse,
} from "@/lib/types/mapa-api";
import { COURSE_MAP_STATUS_LABELS } from "@/lib/types/mapa-api";

function groupDisciplinasByPeriodo(
  disciplinas: DisciplinaRow[]
): Map<number, DisciplinaRow[]> {
  const grouped = new Map<number, DisciplinaRow[]>();

  for (const disciplina of disciplinas) {
    const period = disciplina.periodo ?? 0;
    const bucket = grouped.get(period) ?? [];
    bucket.push(disciplina);
    grouped.set(period, bucket);
  }

  for (const bucket of grouped.values()) {
    bucket.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  return grouped;
}

function buildPeriods(
  grouped: Map<number, DisciplinaRow[]>,
  current: Set<string>,
  completed: Set<string>,
  preRequisitos: Map<string, string[]>
): CourseMapPeriod[] {
  const periods = [...grouped.keys()].sort((a, b) => a - b);

  return periods.map((period) => ({
    period,
    subjects: (grouped.get(period) ?? []).map((disciplina): CourseMapNode => ({
      code: disciplina.codigo,
      name: disciplina.nome,
      ch: disciplina.carga_horaria ?? 0,
      type: disciplina.tipo,
      status: resolveCourseMapStatus(
        disciplina.codigo,
        current,
        completed,
        preRequisitos
      ),
    })),
  }));
}

export function buildMapa(): MapaResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const disciplinas = getDisciplinas();
  if (disciplinas.length === 0) {
    throw notFoundError(
      "Grade curricular não encontrada. Execute o seed do PPC ou sincronize com o SIGAA."
    );
  }

  const semestreAtual = getSemestreAtual();
  const historico = getHistorico();
  const requisitos = getRequisitos();

  const current = buildCurrentDisciplinaSet(
    semestreAtual.map((row) => row.disciplina_id)
  );
  const completed = buildCompletedDisciplinaSet(historico);
  const preRequisitos = buildPreRequisitoMap(requisitos);

  const grouped = groupDisciplinasByPeriodo(disciplinas);
  const periods = buildPeriods(grouped, current, completed, preRequisitos);
  const statuses = periods.flatMap((period) =>
    period.subjects.map((subject) => subject.status)
  );
  const totals = countStatusTotals(statuses);

  return {
    curso: aluno.curso ?? "Engenharia de Computação",
    statusLabels: COURSE_MAP_STATUS_LABELS,
    periods,
    stats: {
      total: statuses.length,
      done: totals.done,
      current: totals.current,
      unlocked: totals.unlocked,
      locked: totals.locked,
    },
  };
}
