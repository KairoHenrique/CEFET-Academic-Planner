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
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  gradeRisk: GradeRisk;
  evaluations: SubjectEvaluation[];
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
  professor?: string;
  schedule?: string;
  ch?: number;
  ementa: string;
  downloadedFiles: number;
  pdfAutoDownload: boolean;
}

export interface SubjectSummary {
  name: string;
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
