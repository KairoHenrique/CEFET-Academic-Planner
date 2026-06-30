export type { SubjectEvaluation, Subject } from "@/lib/types/subject";
import type { Subject, SubjectEvaluation } from "@/lib/types/subject";
import { computeGradeRisk } from "@/lib/disciplinas/grade-risk";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
  SUBJECT_RECOVERY_GRADE,
} from "@/lib/disciplinas/grade-display";

const standardEvaluations = (
  scores: Partial<Record<string, number | null>> = {}
): SubjectEvaluation[] => [
  { name: "PRO1", max: 30, score: scores.PRO1 ?? null },
  { name: "SEM", max: 10, score: scores.SEM ?? null },
  { name: "PRO2", max: 30, score: scores.PRO2 ?? null },
  { name: "Nota", max: 30, score: scores.Nota ?? null },
];

const labEvaluations = (
  scores: Partial<Record<string, number | null>> = {}
): SubjectEvaluation[] => [
  { name: "PRO1", max: 10, score: scores.PRO1 ?? null },
  { name: "SEM", max: 5, score: scores.SEM ?? null },
  { name: "PRO2", max: 10, score: scores.PRO2 ?? null },
];

type SubjectSeed = Omit<
  Subject,
  "ementa" | "downloadedFiles" | "pdfAutoDownload" | "gradeRisk" | "nickname" | "displayName" | "shortLabel" | "officialName" | "syncedRoom"
>;

const semesterSubjectsSeed: SubjectSeed[] = [
  {
    name: "Algoritmos e Estruturas de Dados I",
    code: "AEDI",
    room: "303/620",
    grade: null,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations(),
    absences: 4,
    maxAbsences: 15,
    tasks: 1,
    color: "#3AA0E8",
    professor: "Prof. João Silva",
    schedule: "Qua 7:00 · Sex 10:50",
    ch: 60,
  },
  {
    name: "Arq. e Org. de Computadores I",
    code: "AOCI",
    room: "314",
    grade: null,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations(),
    absences: 2,
    maxAbsences: 15,
    tasks: 0,
    color: "#D4A843",
    professor: "Prof. Maria Costa",
    schedule: "Ter 8:55",
    ch: 60,
  },
  {
    name: "Engenharia de Software",
    code: "ENG-SOFT",
    room: "301/303",
    grade: 24.8,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations({
      PRO1: 9.0,
      SEM: 5.8,
      PRO2: 10.0,
    }),
    absences: 8,
    maxAbsences: 15,
    tasks: 2,
    color: "#F47067",
    professor: "Prof. Ana Lima",
    schedule: "Qua 7:00 · Qui 10:50",
    ch: 60,
  },
  {
    name: "Empreendedorismo e Plano de Negócios",
    code: "EMPREEND",
    room: "301",
    grade: null,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations(),
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#3FB950",
    professor: "Prof. Carlos Mendes",
    schedule: "Ter 19:00",
    ch: 30,
  },
  {
    name: "Introdução à Sociologia",
    code: "SOCIOLOGIA",
    room: "306",
    grade: null,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations(),
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#A371F7",
    professor: "Prof. Rita Alves",
    schedule: "Ter 20:55",
    ch: 30,
  },
  {
    name: "Lab. Alg. e Estruturas de Dados I",
    code: "LAEDI",
    room: "604",
    grade: null,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: standardEvaluations(),
    absences: 2,
    maxAbsences: 11,
    tasks: 0,
    color: "#79C0FF",
    professor: "Prof. João Silva",
    schedule: "Qua 8:55",
    ch: 30,
  },
  {
    name: "Lab. Arq. e Org. de Comp. I",
    code: "LAOCI",
    room: "304",
    grade: 9.0,
    gradeMax: 100,
    passingGrade: 60,
    evaluations: labEvaluations({ PRO1: 9.0 }),
    absences: 4,
    maxAbsences: 7,
    tasks: 2,
    color: "#E3B341",
    professor: "Prof. Maria Costa",
    schedule: "Qui 8:55",
    ch: 30,
  },
];

const defaultSubjectMeta = {
  ementa:
    "Disciplina do curso de Engenharia da Computação. Conteúdo programático conforme PPC vigente do CEFET-MG.",
  downloadedFiles: 0,
  pdfAutoDownload: false,
};

const subjectMeta: Record<
  string,
  Pick<Subject, "ementa" | "downloadedFiles" | "pdfAutoDownload">
> = {
  AEDI: {
    ementa:
      "Introdução a estruturas de dados fundamentais: listas, pilhas, filas, árvores e grafos. Análise de complexidade e implementação em linguagem de programação.",
    downloadedFiles: 8,
    pdfAutoDownload: true,
  },
  AOCI: {
    ementa:
      "Organização básica de computadores, representação de dados, sistema de numeração, lógica digital e arquitetura de conjunto de instruções.",
    downloadedFiles: 5,
    pdfAutoDownload: true,
  },
  "ENG-SOFT": {
    ementa:
      "Processos de software, requisitos, modelagem UML, metodologias ágeis, testes e gestão de projetos. Desenvolvimento de sistema em equipe ao longo do semestre.",
    downloadedFiles: 14,
    pdfAutoDownload: true,
  },
  EMPREEND: {
    ementa:
      "Fundamentos de empreendedorismo, plano de negócios, modelagem canvas e pitch de startups.",
    downloadedFiles: 3,
    pdfAutoDownload: false,
  },
  SOCIOLOGIA: {
    ementa:
      "Introdução aos conceitos sociológicos, trabalho, tecnologia e sociedade contemporânea.",
    downloadedFiles: 2,
    pdfAutoDownload: false,
  },
  LAEDI: {
    ementa:
      "Laboratório prático de implementação de estruturas de dados e algoritmos estudados em AEDI I.",
    downloadedFiles: 4,
    pdfAutoDownload: true,
  },
  LAOCI: {
    ementa:
      "Laboratório de circuitos digitais, portas lógicas, ULA e montagem de sistemas combinacionais.",
    downloadedFiles: 6,
    pdfAutoDownload: true,
  },
};

export const semesterSubjects: Subject[] = semesterSubjectsSeed.map((subject) => ({
  ...subject,
  syncedRoom: subject.room,
  syncedSchedule: subject.schedule ?? null,
  syncedProfessor: subject.professor ?? null,
  syncedWeeklyHours: subject.ch ?? null,
  officialName: subject.name,
  nickname: null,
  displayName: subject.name,
  shortLabel: subject.code,
  ...(subjectMeta[subject.code] ?? defaultSubjectMeta),
  gradeRisk: computeGradeRisk({
    evaluations: subject.evaluations,
    passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
    gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
    recoveryGrade: SUBJECT_RECOVERY_GRADE,
    grade: subject.grade,
    absences: subject.absences,
    maxAbsences: subject.maxAbsences,
  }),
}));

export function getSubjectByCode(code: string): Subject | undefined {
  return semesterSubjects.find(
    (s) => s.code.toLowerCase() === code.toLowerCase()
  );
}

export function sumEvaluationScores(
  evaluations: SubjectEvaluation[]
): number {
  return evaluations.reduce((acc, ev) => acc + (ev.score ?? 0), 0);
}
