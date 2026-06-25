export interface SubjectEvaluation {
  name: string;
  max: number;
  score: number | null;
  manual?: boolean;
}

export interface Subject {
  name: string;
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
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
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
}
