import { notFoundError } from "@/lib/api/errors";
import {
  getAluno,
  getDisciplinas,
  getHistorico,
  getIntegralizacao,
  getRequisitos,
  getSemestreAtual,
} from "@/lib/db/queries";
import {
  buildCompletedDisciplinaSet,
  buildCursandoDisciplinaSet,
  buildCurrentDisciplinaSet,
  buildPreRequisitoMap,
  countStatusTotals,
  mergeDisciplinaSets,
  normalizeDisciplinaCode,
  resolveCourseMapStatusResult,
} from "@/lib/mapa/course-status";
import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import { buildDisciplineShortLabelRegistry } from "@/lib/disciplinas/subject-display-name";
import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import {
  getChCatalog,
  getChCatalogForCurso,
} from "@/lib/integralizacao/ch-catalog";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import { mapDisciplineTipoToChType } from "@/lib/integralizacao/map-discipline-tipo-to-ch";
import { getObrigatoriaTotalFromCatalog } from "@/lib/mapa/period-ch-gates";
import type {
  AlunoRow,
  DisciplinaRow,
  HistoricoRow,
  IntegralizacaoRow,
  RequisitoRow,
  SemestreAtualWithDisciplina,
} from "@/lib/types/db";
import type {
  CourseMapNode,
  CourseMapPeriod,
  MapaResponse,
} from "@/lib/types/mapa-api";
import { COURSE_MAP_STATUS_LABELS } from "@/lib/types/mapa-api";

/** Mapa PPC: só grade obrigatória (períodos 1–10). Optativas ficam em integralização + sync. */
function filterGradeObrigatoriaDisciplinas(
  disciplinas: DisciplinaRow[]
): DisciplinaRow[] {
  return disciplinas.filter((disciplina) => {
    const period = disciplina.periodo ?? 0;
    if (period <= 0) return false;
    return mapDisciplineTipoToChType(disciplina.tipo) !== "Optativa";
  });
}

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
  preRequisitos: Map<string, string[]>,
  obrigatoriaDone: number,
  obrigatoriaTotal: number,
  allDisciplinas: DisciplinaRow[]
): CourseMapPeriod[] {
  const periods = [...grouped.keys()].sort((a, b) => a - b);
  const shortLabelRegistry = buildDisciplineShortLabelRegistry(
    allDisciplinas.map((disciplina) => ({
      code: disciplina.codigo,
      name: disciplina.nome,
    }))
  );

  return periods.map((period) => ({
    period,
    subjects: (grouped.get(period) ?? []).map((disciplina): CourseMapNode => {
      const resolved = resolveCourseMapStatusResult({
        disciplina,
        current,
        completed,
        preRequisitos,
        obrigatoriaDone,
        obrigatoriaTotal,
        allDisciplinas,
      });

      return {
        code: disciplina.codigo,
        shortLabel:
          shortLabelRegistry.get(
            normalizeDisciplinaCode(disciplina.codigo)
          ) ?? disciplina.codigo,
        name: disciplina.nome,
        ch: normalizeCefetCh(disciplina.carga_horaria ?? 0),
        type: disciplina.tipo,
        status: resolved.status,
        blockedBy: resolved.blockedBy,
        chRemaining: resolved.chRemaining,
      };
    }),
  }));
}

interface MapaAssemblyInput {
  cursoLabel: string;
  disciplinas: DisciplinaRow[];
  semestreAtual: SemestreAtualWithDisciplina[];
  historico: HistoricoRow[];
  requisitos: RequisitoRow[];
  integralizacaoRows: IntegralizacaoRow[];
}

function assembleMapaFromData(input: MapaAssemblyInput): MapaResponse {
  const {
    cursoLabel,
    disciplinas,
    semestreAtual,
    historico,
    requisitos,
    integralizacaoRows,
  } = input;

  if (disciplinas.length === 0) {
    throw notFoundError(
      "Grade curricular não encontrada. Execute o seed do PPC ou sincronize com o SIGAA."
    );
  }

  const current = mergeDisciplinaSets(
    buildCurrentDisciplinaSet(semestreAtual.map((row) => row.disciplina_id)),
    buildCursandoDisciplinaSet(historico)
  );
  const completed = buildCompletedDisciplinaSet(historico);
  const preRequisitos = buildPreRequisitoMap(requisitos);
  const catalog = getChCatalogForCurso(resolveQueryCursoId());
  const syncedObrigatoria =
    integralizacaoRows.find(
      (row) => row.tipo_ch === "Obrigatória" && row.manual === 0
    )?.concluido ?? 0;

  const computedCh = computeChDoneFromDisciplinas(
    disciplinas,
    historico,
    semestreAtual.map((row) => row.disciplina_id)
  );
  const obrigatoriaDone = Math.max(computedCh.Obrigatória, syncedObrigatoria);
  const obrigatoriaTotal = getObrigatoriaTotalFromCatalog(catalog);

  const gradeDisciplinas = filterGradeObrigatoriaDisciplinas(disciplinas);
  const grouped = groupDisciplinasByPeriodo(gradeDisciplinas);
  const periods = buildPeriods(
    grouped,
    current,
    completed,
    preRequisitos,
    obrigatoriaDone,
    obrigatoriaTotal,
    gradeDisciplinas
  );
  const statuses = periods.flatMap((period) =>
    period.subjects.map((subject) => subject.status)
  );
  const totals = countStatusTotals(statuses);

  return {
    curso: cursoLabel,
    statusLabels: COURSE_MAP_STATUS_LABELS,
    periods,
    stats: {
      total: statuses.length,
      done: totals.done,
      current: totals.current,
      unlocked: totals.unlocked,
      locked: totals.locked,
    },
    historicoSynced: historico.length > 0,
  };
}

export interface MapaQueryDeps {
  getAluno: () => Promise<AlunoRow | undefined>;
  getDisciplinas: () => Promise<DisciplinaRow[]>;
  getSemestreAtual: () => Promise<SemestreAtualWithDisciplina[]>;
  getHistorico: () => Promise<HistoricoRow[]>;
  getRequisitos: () => Promise<RequisitoRow[]>;
  getIntegralizacao: () => Promise<IntegralizacaoRow[]>;
}

export async function buildMapaFromQueries(
  deps: MapaQueryDeps,
  options?: { cursoLabel?: string }
): Promise<MapaResponse> {
  const aluno = await deps.getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  return assembleMapaFromData({
    cursoLabel: options?.cursoLabel ?? aluno.curso ?? "Engenharia de Computação",
    disciplinas: await deps.getDisciplinas(),
    semestreAtual: await deps.getSemestreAtual(),
    historico: await deps.getHistorico(),
    requisitos: await deps.getRequisitos(),
    integralizacaoRows: await deps.getIntegralizacao(),
  });
}

export function buildMapa(): MapaResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  return assembleMapaFromData({
    cursoLabel: aluno.curso ?? "Engenharia de Computação",
    disciplinas: getDisciplinas(),
    semestreAtual: getSemestreAtual(),
    historico: getHistorico(),
    requisitos: getRequisitos(),
    integralizacaoRows: getIntegralizacao(),
  });
}
