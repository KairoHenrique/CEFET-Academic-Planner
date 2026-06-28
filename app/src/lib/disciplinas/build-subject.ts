import {
  countFaltasByDisciplina,
  countTarefasPendentesByDisciplina,
  getDisciplinaByCodigo,
  getNotasByDisciplina,
} from "@/lib/db/queries";
import type { SemestreAtualWithDisciplina } from "@/lib/types/db";
import type { Subject, SubjectSummary } from "@/lib/types/subject";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
  SUBJECT_RECOVERY_GRADE,
} from "@/lib/disciplinas/grade-display";
import { mapNotasToEvaluations } from "./mappers";
import { computeGrade } from "./grade";
import { computeGradeRisk } from "./grade-risk";
import { resolveSubjectDisplayName, resolveSubjectShortLabel } from "./subject-display-name";
import { resolvePpcEmenta } from "./resolve-ppc-ementa";

function buildGradeRisk(
  semestre: SemestreAtualWithDisciplina,
  evaluations: ReturnType<typeof mapNotasToEvaluations>,
  grade: number | null
) {
  const absences = countFaltasByDisciplina(semestre.disciplina_id);
  const maxAbsences = semestre.max_faltas ?? 15;

  return computeGradeRisk({
    evaluations,
    passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
    gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
    recoveryGrade: SUBJECT_RECOVERY_GRADE,
    grade,
    absences,
    maxAbsences,
  });
}

export function buildSubjectSummary(
  semestre: SemestreAtualWithDisciplina
): SubjectSummary {
  const notas = getNotasByDisciplina(semestre.disciplina_id);
  const evaluations = mapNotasToEvaluations(notas);
  const grade = computeGrade(semestre.disciplina_id);

  const nickname = semestre.apelido?.trim() || null;
  const officialName = semestre.nome;
  const displayName = semestre.nome_exibicao?.trim() || officialName;

  return {
    name: displayName,
    nickname,
    displayName: resolveSubjectDisplayName(displayName, nickname),
    shortLabel: resolveSubjectShortLabel(semestre.disciplina_id, nickname, officialName),
    code: semestre.disciplina_id,
    room: semestre.local ?? "—",
    grade,
    gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
    passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
    gradeRisk: buildGradeRisk(semestre, evaluations, grade),
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
    ch: semestre.carga_horaria ?? undefined,
    professor: semestre.professor ?? undefined,
    schedule: semestre.horario_traduzido ?? undefined,
  };
}

export function buildSubjectFromSemestre(
  semestre: SemestreAtualWithDisciplina
): Subject {
  const disciplina = getDisciplinaByCodigo(semestre.disciplina_id);
  const summary = buildSubjectSummary(semestre);
  const officialName = semestre.nome;
  const notas = getNotasByDisciplina(semestre.disciplina_id);
  const evaluations = mapNotasToEvaluations(notas);

  return {
    ...summary,
    officialName,
    gradeRisk: buildGradeRisk(semestre, evaluations, summary.grade),
    evaluations,
    professor: semestre.professor ?? undefined,
    schedule: semestre.horario_traduzido ?? undefined,
    ch: semestre.carga_horaria ?? disciplina?.carga_horaria ?? undefined,
    ementa: disciplina
      ? resolvePpcEmenta(
          disciplina.codigo,
          disciplina.nome,
          disciplina.carga_horaria ?? semestre.carga_horaria ?? 0,
          disciplina.periodo ?? 0
        )
      : "Disciplina do curso de Engenharia da Computação. Conteúdo programático conforme PPC vigente do CEFET-MG.",
    downloadedFiles: semestre.arquivos_baixados ?? 0,
    pdfAutoDownload: semestre.pdf_auto_download === 1,
  };
}
