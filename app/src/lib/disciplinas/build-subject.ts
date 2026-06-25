import {
  countFaltasByDisciplina,
  countTarefasPendentesByDisciplina,
  getDisciplinaByCodigo,
  getNotasByDisciplina,
} from "@/lib/db/queries";
import type { SemestreAtualWithDisciplina } from "@/lib/types/db";
import type { Subject, SubjectSummary } from "@/lib/types/subject";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";
import { mapNotasToEvaluations } from "./mappers";
import { computeGrade } from "./grade";

export function buildSubjectSummary(
  semestre: SemestreAtualWithDisciplina
): SubjectSummary {
  return {
    name: semestre.nome,
    code: semestre.disciplina_id,
    room: semestre.local ?? "—",
    grade: computeGrade(semestre.disciplina_id),
    gradeMax: semestre.nota_maxima ?? 100,
    absences: countFaltasByDisciplina(semestre.disciplina_id),
    maxAbsences: semestre.max_faltas ?? 15,
    tasks: countTarefasPendentesByDisciplina(semestre.disciplina_id),
    color: semestre.cor ?? "#3AA0E8",
  };
}

export function buildSubjectListItem(
  semestre: SemestreAtualWithDisciplina
): SubjectListItem {
  const summary = buildSubjectSummary(semestre);
  return {
    ...summary,
    professor: semestre.professor ?? undefined,
    schedule: semestre.horario_traduzido ?? undefined,
  };
}

export function buildSubjectFromSemestre(
  semestre: SemestreAtualWithDisciplina
): Subject {
  const disciplina = getDisciplinaByCodigo(semestre.disciplina_id);
  const summary = buildSubjectSummary(semestre);
  const notas = getNotasByDisciplina(semestre.disciplina_id);

  return {
    ...summary,
    passingGrade: semestre.nota_aprovacao ?? 60,
    evaluations: mapNotasToEvaluations(notas),
    professor: semestre.professor ?? undefined,
    schedule: semestre.horario_traduzido ?? undefined,
    ch: semestre.carga_horaria ?? disciplina?.carga_horaria ?? undefined,
    ementa:
      disciplina?.ementa ??
      "Disciplina do curso de Engenharia da Computação. Conteúdo programático conforme PPC vigente do CEFET-MG.",
    downloadedFiles: semestre.arquivos_baixados ?? 0,
    pdfAutoDownload: semestre.pdf_auto_download === 1,
  };
}
