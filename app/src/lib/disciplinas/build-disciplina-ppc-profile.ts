import { notFoundError } from "@/lib/api/errors";
import { getDisciplinaByCodigo } from "@/lib/db/queries";
import { maxAbsencesFromCefetCh, normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
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

  const ch = normalizeCefetCh(disciplina.carga_horaria ?? 0);
  const maxAbsences = maxAbsencesFromCefetCh(ch);

  const ementa = resolvePpcEmenta(
    disciplina.codigo,
    disciplina.nome,
    ch
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
        maxAbsences,
      }),
      absences: 0,
      maxAbsences,
      tasks: 0,
      color: "#3AA0E8",
      evaluations,
      professor: undefined,
      schedule: undefined,
      ch,
      ementa,
    },
    tasks: [],
    attendance: {
      records: [],
      daysRemaining: 0,
    },
    grupo: { nome: null, membros: [] },
  };
}
