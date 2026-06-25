export type TaskType = "individual" | "grupo";

export interface AcademicTask {
  id: number;
  title: string;
  subject: string;
  subjectCode: string;
  subjectColor: string;
  date: string;
  type: TaskType;
  done: boolean;
  description: string;
  instructions: string[];
  deliverables: string[];
  hasGrade: boolean;
  maxGrade?: number;
}
