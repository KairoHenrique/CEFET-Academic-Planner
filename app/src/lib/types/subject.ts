import type { GradeRisk } from "@/lib/types/grade-risk";

export interface SubjectEvaluation {
  id?: number;
  name: string;
  max: number;
  score: number | null;
  manual?: boolean;
  userOverride?: boolean;
  extra?: boolean;
}

export interface Subject {
  name: string;
  officialName: string;
  nickname: string | null;
  displayName: string;
  shortLabel: string;
  code: string;
  room: string;
  syncedRoom: string | null;
  schedule?: string;
  syncedSchedule: string | null;
  professor?: string;
  syncedProfessor: string | null;
  ch?: number;
  syncedWeeklyHours: number | null;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  gradeRisk: GradeRisk;
  evaluations: SubjectEvaluation[];
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
  ementa: string;
  downloadedFiles: number;
  pdfAutoDownload: boolean;
}

export interface SubjectSummary {
  name: string;
  nickname: string | null;
  displayName: string;
  shortLabel: string;
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  gradeRisk: GradeRisk;
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
}
