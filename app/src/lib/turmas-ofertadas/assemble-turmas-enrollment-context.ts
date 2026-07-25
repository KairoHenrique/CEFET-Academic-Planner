import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import { getChCatalog, getChCatalogForCurso } from "@/lib/integralizacao/ch-catalog";
import {
  buildActiveCurrentDisciplinaSet,
  buildCompletedDisciplinaSet,
  buildCoRequisitoMap,
  buildFailedDisciplinaSet,
  buildGradeTotalsByDisciplinaCode,
  buildPreRequisitoMap,
  mergeCompletedWithClosedSemesterGrades,
  normalizeDisciplinaCode,
} from "@/lib/mapa/course-status";
import { getObrigatoriaTotalFromCatalog } from "@/lib/mapa/period-ch-gates";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import type {
  DisciplinaRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  RequisitoRow,
  SemestreAtualWithDisciplina,
  TurmaOfertadaRow,
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
  notas?: NotaRow[];
}): TurmasEnrollmentContext {
  const semestreCodes = input.semestreAtual.map((row) => row.disciplina_id);
  const completed =
    input.notas && input.notas.length > 0
      ? mergeCompletedWithClosedSemesterGrades({
          historico: input.historico,
          semestreAtualCodes: semestreCodes,
          gradeTotalsByCode: buildGradeTotalsByDisciplinaCode(input.notas),
        })
      : buildCompletedDisciplinaSet(input.historico);
  const failed = buildFailedDisciplinaSet(input.historico);
  const current = buildActiveCurrentDisciplinaSet(
    semestreCodes,
    input.historico
  );
  for (const code of completed) {
    current.delete(code);
  }
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
  context: TurmasEnrollmentContext,
  turmasOfertadasRows?: Pick<TurmaOfertadaRow, "codigo_disciplina" | "nome">[]
): TurmasOfertadasEnrollmentContext {
  const disciplinaNames: TurmasOfertadasEnrollmentContext["disciplinaNames"] =
    {};
  for (const disciplina of context.disciplinas) {
    const code = normalizeDisciplinaCode(disciplina.codigo);
    const name = disciplina.nome?.trim();
    if (!code || !name) continue;
    disciplinaNames[code] = name;
  }

  if (turmasOfertadasRows) {
    for (const row of turmasOfertadasRows) {
      const code = normalizeDisciplinaCode(row.codigo_disciplina);
      if (!disciplinaNames[code] && row.nome) {
        disciplinaNames[code] = row.nome.trim();
      }
    }
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
