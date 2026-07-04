import { buildDisciplinaPpcProfile } from "@/lib/disciplinas/build-disciplina-ppc-profile";
import { buildAttendanceSummary } from "@/lib/disciplinas/attendance";
import { buildSubjectFromSemestre } from "@/lib/disciplinas/build-subject";
import { mapGrupoMembros, mapTarefaToAcademicTask } from "@/lib/disciplinas/mappers";
import { sanitizeGrupoNome } from "@/lib/scraper/turma-virtual/parse-grupo-page";
import type { SubjectDetailResponse } from "@/lib/types/disciplinas-api";
import type {
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";

export interface DisciplinaDetailQueryDeps {
  getSemestreAtualByCodigo: (
    code: string
  ) => Promise<SemestreAtualWithDisciplina | undefined>;
  getDisciplinaByCodigo: (code: string) => Promise<DisciplinaRow | undefined>;
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
      return buildDisciplinaPpcProfile(code);
    }
    return buildDisciplinaPpcProfile(code, disciplina);
  }

  const subject = buildSubjectFromSemestre(semestre);
  const faltas = await deps.getFaltasByDisciplina(semestre.disciplina_id);
  const attendance = buildAttendanceSummary(faltas, subject.maxAbsences);
  const membros = mapGrupoMembros(
    await deps.getGrupoByDisciplina(semestre.disciplina_id)
  );

  const tasks = (await deps.getTarefasByDisciplina(semestre.disciplina_id)).map(
    (row) =>
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
