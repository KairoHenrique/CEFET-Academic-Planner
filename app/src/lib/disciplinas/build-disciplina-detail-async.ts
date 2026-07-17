import { buildDisciplinaPpcProfile } from "@/lib/disciplinas/build-disciplina-ppc-profile";
import { buildAttendanceSummary } from "@/lib/disciplinas/attendance";
import { buildSubjectFromSemestreCore } from "@/lib/disciplinas/build-subject";
import { resolveSubjectSourceFromRows } from "@/lib/disciplinas/build-subject-source";
import { mapGrupoMembros, mapTarefaToAcademicTask } from "@/lib/disciplinas/mappers";
import { sanitizeGrupoNome } from "@/lib/scraper/turma-virtual/parse-grupo-page";
import type { SubjectDetailResponse } from "@/lib/types/disciplinas-api";
import type {
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  NotaRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";

export interface DisciplinaDetailQueryDeps {
  getSemestreAtualByCodigo: (
    code: string
  ) => Promise<SemestreAtualWithDisciplina | undefined>;
  getDisciplinaByCodigo: (code: string) => Promise<DisciplinaRow | undefined>;
  getNotasByDisciplina: (disciplinaId: string) => Promise<NotaRow[]>;
  getFaltasByDisciplina: (disciplinaId: string) => Promise<FaltaRow[]>;
  getGrupoByDisciplina: (disciplinaId: string) => Promise<GrupoMembroRow[]>;
  getTarefasByDisciplina: (disciplinaId: string) => Promise<TarefaRow[]>;
}

export async function buildDisciplinaDetailFromQueries(
  code: string,
  deps: DisciplinaDetailQueryDeps
): Promise<SubjectDetailResponse> {
  const semestre = await deps.getSemestreAtualByCodigo(code);
  if (!semestre) {
    const disciplina = await deps.getDisciplinaByCodigo(code);
    if (!disciplina) {
      return buildDisciplinaPpcProfile(code, undefined, true);
    }
    return buildDisciplinaPpcProfile(code, disciplina, true);
  }

  const disciplinaId = semestre.disciplina_id;
  const [disciplina, notas, faltas, tarefaRows, grupoRows] = await Promise.all([
    deps.getDisciplinaByCodigo(disciplinaId),
    deps.getNotasByDisciplina(disciplinaId),
    deps.getFaltasByDisciplina(disciplinaId),
    deps.getTarefasByDisciplina(disciplinaId),
    deps.getGrupoByDisciplina(disciplinaId),
  ]);

  const subject = buildSubjectFromSemestreCore(semestre, {
    ...resolveSubjectSourceFromRows(notas, faltas, tarefaRows),
    disciplina,
  });
  const attendance = buildAttendanceSummary(faltas, subject.maxAbsences);
  const membros = mapGrupoMembros(grupoRows);

  const tasks = tarefaRows.map((row) =>
    mapTarefaToAcademicTask(
      { ...row, disciplina_nome: semestre.nome },
      subject.color
    )
  );

  return {
    subject,
    tasks,
    attendance,
    grupo: {
      nome: sanitizeGrupoNome(semestre.grupo_nome),
      membros,
    },
  };
}
