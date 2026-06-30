import { notFoundError } from "@/lib/api/errors";
import { getDisciplinaByCodigo } from "@/lib/db/queries";
import type { SubjectDetailResponse } from "@/lib/types/disciplinas-api";
import { resolvePpcEmenta } from "./resolve-ppc-ementa";
import { resolveSubjectShortLabel } from "./subject-display-name";
import { computeGradeRisk } from "./grade-risk";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
  SUBJECT_RECOVERY_GRADE,
} from "./grade-display";

export function buildDisciplinaPpcProfile(code: string): SubjectDetailResponse {
  const disciplina = getDisciplinaByCodigo(code);
  if (!disciplina) {
    throw notFoundError("Disciplina não encontrada no PPC do curso.");
  }

  const ementa = resolvePpcEmenta(
    disciplina.codigo,
    disciplina.nome,
    disciplina.carga_horaria ?? 0
  );

  const evaluations: never[] = [];

  return {
    catalogOnly: true,
    subject: {
      code: disciplina.codigo,
      name: disciplina.nome,
      officialName: disciplina.nome,
      nickname: null,
      displayName: disciplina.nome,
      shortLabel: resolveSubjectShortLabel(disciplina.codigo, null),
      room: "—",
      syncedRoom: null,
      syncedSchedule: null,
      syncedProfessor: null,
      syncedWeeklyHours: null,
      grade: null,
      gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
      passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
      gradeRisk: computeGradeRisk({
        evaluations,
        passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
        gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
        recoveryGrade: SUBJECT_RECOVERY_GRADE,
        grade: null,
        absences: 0,
        maxAbsences: 15,
      }),
      absences: 0,
      maxAbsences: 15,
      tasks: 0,
      color: "#3AA0E8",
      evaluations,
      professor: undefined,
      schedule: undefined,
      ch: disciplina.carga_horaria ?? undefined,
      ementa,
      downloadedFiles: 0,
      pdfAutoDownload: false,
    },
    tasks: [],
    attendance: {
      records: [],
      daysRemaining: 0,
    },
    grupo: [],
  };
}
