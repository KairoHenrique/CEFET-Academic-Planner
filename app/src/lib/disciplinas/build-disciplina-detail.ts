import {
  getFaltasByDisciplina,
  getGrupoByDisciplina,
  getSemestreAtualByCodigo,
  getTarefasByDisciplina,
} from "@/lib/db/queries";
import type { SubjectDetailResponse } from "@/lib/types/disciplinas-api";
import { buildDisciplinaPpcProfile } from "./build-disciplina-ppc-profile";
import { buildAttendanceSummary } from "./attendance";
import { buildSubjectFromSemestre } from "./build-subject";
import { mapGrupoMembros, mapTarefaToAcademicTask } from "./mappers";
import { sanitizeGrupoNome } from "@/lib/scraper/turma-virtual/parse-grupo-page";

export function buildDisciplinaDetail(code: string): SubjectDetailResponse {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    return buildDisciplinaPpcProfile(code);
  }

  const subject = buildSubjectFromSemestre(semestre);
  const faltas = getFaltasByDisciplina(semestre.disciplina_id);
  const attendance = buildAttendanceSummary(faltas, subject.maxAbsences);
  const membros = mapGrupoMembros(
    getGrupoByDisciplina(semestre.disciplina_id)
  );

  const tasks = getTarefasByDisciplina(semestre.disciplina_id).map((row) =>
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
