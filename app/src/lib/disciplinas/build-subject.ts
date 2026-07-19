import {
  countFaltasByDisciplina,
  countTarefasPendentesByDisciplina,
  getDisciplinaByCodigo,
  getNotasByDisciplina,
} from "@/lib/db/queries";
import type {
  DisciplinaRow,
  NotaRow,
  SemestreAtualWithDisciplina,
} from "@/lib/types/db";
import type { Subject, SubjectSummary } from "@/lib/types/subject";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
  SUBJECT_RECOVERY_GRADE,
} from "@/lib/disciplinas/grade-display";
import { mapNotasToEvaluations } from "./mappers";
import { computeGrade, computeGradeFromNotas } from "./grade";
import { computeGradeRisk } from "./grade-risk";

/**
 * Dados por disciplina já carregados (agnóstico de backend). Permite construir
 * o resumo tanto no SQLite (dev/PC) quanto no Postgres (cloud) sem duplicar
 * regras de negócio.
 */
export interface SubjectSourceData {
  notas: NotaRow[];
  absences: number;
  tarefasPendentes: number;
}

/** Fonte completa para o detalhe (inclui a linha de PPC da disciplina). */
export interface SubjectDetailSource extends SubjectSourceData {
  disciplina: DisciplinaRow | undefined;
}
import { resolveSubjectDisplayName, resolveSubjectShortLabel } from "./subject-display-name";
import { resolvePpcEmenta } from "./resolve-ppc-ementa";
import { resolveSubjectDisplayRoom, resolveSubjectSyncedRoom } from "./subject-room";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import {
  resolveDisplayProfessor,
  resolveDisplaySchedule,
  resolveDisplayWeeklyHours,
  resolveSyncedProfessor,
  resolveSyncedSchedule,
  resolveSyncedWeeklyHours,
} from "./subject-schedule-meta";

function buildGradeRisk(
  semestre: SemestreAtualWithDisciplina,
  evaluations: ReturnType<typeof mapNotasToEvaluations>,
  grade: number | null,
  absences: number
) {
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

function resolveSubjectMeta(semestre: SemestreAtualWithDisciplina) {
  const syncedSchedule = resolveSyncedSchedule(semestre);
  const syncedProfessor = resolveSyncedProfessor(semestre);
  const syncedWeeklyHours = resolveSyncedWeeklyHours(semestre);
  const schedule = resolveDisplaySchedule(semestre) ?? undefined;
  const professor = resolveDisplayProfessor(semestre) ?? undefined;
  const weeklyHours = resolveDisplayWeeklyHours(semestre);

  return {
    syncedSchedule,
    syncedProfessor,
    syncedWeeklyHours,
    schedule,
    professor,
    ch: weeklyHours != null && weeklyHours > 0 ? weeklyHours : undefined,
  };
}

/** Núcleo puro — recebe notas/faltas/tarefas já carregadas (qualquer backend). */
export function buildSubjectSummaryCore(
  semestre: SemestreAtualWithDisciplina,
  source: SubjectSourceData
): SubjectSummary {
  const evaluations = mapNotasToEvaluations(source.notas);
  const grade = computeGradeFromNotas(source.notas);

  const nickname = semestre.apelido?.trim() || null;
  const officialName = semestre.nome;
  const displayName = semestre.nome_exibicao?.trim() || officialName;

  return {
    name: displayName,
    nickname,
    displayName: resolveSubjectDisplayName(displayName, nickname),
    shortLabel: resolveSubjectShortLabel(semestre.disciplina_id, nickname, officialName),
    code: semestre.disciplina_id,
    room: resolveSubjectDisplayRoom(semestre),
    grade,
    gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
    passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
    gradeRisk: buildGradeRisk(semestre, evaluations, grade, source.absences),
    absences: source.absences,
    maxAbsences: semestre.max_faltas ?? 15,
    tasks: source.tarefasPendentes,
    color: semestre.cor ?? "#3AA0E8",
  };
}

export function buildSubjectListItemCore(
  semestre: SemestreAtualWithDisciplina,
  source: SubjectSourceData
): SubjectListItem {
  const summary = buildSubjectSummaryCore(semestre, source);
  const meta = resolveSubjectMeta(semestre);

  return {
    ...summary,
    ch: meta.ch,
    professor: meta.professor,
    schedule: meta.schedule,
  };
}

function readSqliteSubjectSource(
  semestre: SemestreAtualWithDisciplina
): SubjectSourceData {
  return {
    notas: getNotasByDisciplina(semestre.disciplina_id),
    absences: countFaltasByDisciplina(semestre.disciplina_id),
    tarefasPendentes: countTarefasPendentesByDisciplina(semestre.disciplina_id),
  };
}

export function buildSubjectSummary(
  semestre: SemestreAtualWithDisciplina
): SubjectSummary {
  return buildSubjectSummaryCore(semestre, readSqliteSubjectSource(semestre));
}

export function buildSubjectListItem(
  semestre: SemestreAtualWithDisciplina
): SubjectListItem {
  return buildSubjectListItemCore(semestre, readSqliteSubjectSource(semestre));
}

/** Núcleo puro — recebe disciplina/notas/faltas já carregadas (qualquer backend). */
export function buildSubjectFromSemestreCore(
  semestre: SemestreAtualWithDisciplina,
  source: SubjectDetailSource
): Subject {
  const { disciplina, notas } = source;
  const summary = buildSubjectSummaryCore(semestre, source);
  const officialName = semestre.nome;
  const syncedRoom = resolveSubjectSyncedRoom(semestre);
  const meta = resolveSubjectMeta(semestre);
  const evaluations = mapNotasToEvaluations(notas);
  const ementaCargaHoraria = disciplina?.carga_horaria ?? 0;

  return {
    ...summary,
    syncedRoom,
    syncedSchedule: meta.syncedSchedule,
    syncedProfessor: meta.syncedProfessor,
    syncedWeeklyHours: meta.syncedWeeklyHours,
    officialName,
    gradeRisk: buildGradeRisk(semestre, evaluations, summary.grade, summary.absences),
    evaluations,
    professor: meta.professor,
    schedule: meta.schedule,
    ch: meta.ch,
    ementa: disciplina
      ? resolvePpcEmenta(
          disciplina.codigo,
          disciplina.nome,
          ementaCargaHoraria,
          resolveQueryCursoId()
        )
      : "Disciplina do curso. Conteúdo programático conforme PPC vigente do CEFET-MG.",
  };
}

export function buildSubjectFromSemestre(
  semestre: SemestreAtualWithDisciplina
): Subject {
  return buildSubjectFromSemestreCore(semestre, {
    ...readSqliteSubjectSource(semestre),
    disciplina: getDisciplinaByCodigo(semestre.disciplina_id),
  });
}
