import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import { getChCatalog, getChCatalogForCurso } from "@/lib/integralizacao/ch-catalog";
import {
  buildActiveCurrentDisciplinaSet,
  buildCompletedDisciplinaSet,
  buildCoRequisitoMap,
  buildFailedDisciplinaSet,
  buildPreRequisitoMap,
  normalizeDisciplinaCode,
} from "@/lib/mapa/course-status";
import { getObrigatoriaTotalFromCatalog } from "@/lib/mapa/period-ch-gates";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import type {
  DisciplinaRow,
  HistoricoRow,
  IntegralizacaoRow,
  RequisitoRow,
  SemestreAtualWithDisciplina,
} from "@/lib/types/db";
import type { TurmasOfertadasEnrollmentContext } from "@/lib/types/turmas-ofertadas-api";

export interface TurmasEnrollmentContext {
  disciplinas: DisciplinaRow[];
  current: Set<string>;
  completed: Set<string>;
  failed: Set<string>;
  preRequisitos: Map<string, string[]>;
  coRequisitos: Map<string, string[]>;
  obrigatoriaDone: number;
  obrigatoriaTotal: number;
}

export function assembleTurmasEnrollmentContext(input: {
  disciplinas: DisciplinaRow[];
  historico: HistoricoRow[];
  semestreAtual: SemestreAtualWithDisciplina[];
  requisitos: RequisitoRow[];
  integralizacaoRows: IntegralizacaoRow[];
}): TurmasEnrollmentContext {
  const completed = buildCompletedDisciplinaSet(input.historico);
  const failed = buildFailedDisciplinaSet(input.historico);
  const current = buildActiveCurrentDisciplinaSet(
    input.semestreAtual.map((row) => row.disciplina_id),
    input.historico
  );
  const preRequisitos = buildPreRequisitoMap(input.requisitos);
  const coRequisitos = buildCoRequisitoMap(input.requisitos);
  const catalog = getChCatalogForCurso(resolveQueryCursoId()) ?? getChCatalog();
  const syncedObrigatoria =
    input.integralizacaoRows.find(
      (row) => row.tipo_ch === "Obrigatória" && row.manual === 0
    )?.concluido ?? 0;

  const computedCh = computeChDoneFromDisciplinas(
    input.disciplinas,
    input.historico,
    input.semestreAtual.map((row) => row.disciplina_id)
  );
  const obrigatoriaDone = Math.max(computedCh.Obrigatória, syncedObrigatoria);
  const obrigatoriaTotal = getObrigatoriaTotalFromCatalog(catalog);

  return {
    disciplinas: input.disciplinas,
    current,
    completed,
    failed,
    preRequisitos,
    coRequisitos,
    obrigatoriaDone,
    obrigatoriaTotal,
  };
}

export function serializeEnrollmentContextForClient(
  context: TurmasEnrollmentContext
): TurmasOfertadasEnrollmentContext {
  const disciplinaNames: TurmasOfertadasEnrollmentContext["disciplinaNames"] =
    {};
  for (const disciplina of context.disciplinas) {
    const code = normalizeDisciplinaCode(disciplina.codigo);
    const name = disciplina.nome?.trim();
    if (!code || !name) continue;
    disciplinaNames[code] = name;
  }

  const coRequisitos: TurmasOfertadasEnrollmentContext["coRequisitos"] = {};
  for (const [disciplinaId, codes] of context.coRequisitos) {
    coRequisitos[disciplinaId] = codes;
  }

  return {
    completedDisciplinaCodes: Array.from(context.completed),
    coRequisitos,
    disciplinaNames,
  };
}
