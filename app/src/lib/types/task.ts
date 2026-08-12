export type TaskType = "individual" | "grupo";

export interface AcademicTask {
  id: number;
  title: string;
  subject: string;
  subjectCode: string;
  subjectColor: string;
  date: string;
  dueDateIso: string;
  dueTime: string;
  type: TaskType;
  done: boolean;
  manual: boolean;
  description: string;
  instructions: string[];
  deliverables: string[];
  hasGrade: boolean;
  maxGrade?: number;
  /** ID do link JSF em Minhas atividades (`formAtividades:…`). */
  sigaaLinkId?: string | null;
  /** Tarefa sincronizada do SIGAA e ainda não enviada. */
  submittable?: boolean;
}
