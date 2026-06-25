import type { Subject, SubjectEvaluation } from "./subject";
import type { AcademicTask } from "./task";
import type { AttendanceSummary } from "./attendance";

export interface SubjectListItem {
  name: string;
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
  professor?: string;
  schedule?: string;
}

export type DisciplinaListFilter = "todas" | "com_tarefas" | "risco_faltas";

export interface DisciplinaListResponse {
  items: SubjectListItem[];
}

export interface GrupoMembroDto {
  nome: string;
  matricula: string | null;
  email: string | null;
  curso: string | null;
}

export interface SubjectDetailResponse {
  subject: Subject;
  tasks: AcademicTask[];
  attendance: AttendanceSummary;
  grupo: GrupoMembroDto[];
}

export interface PatchNotasAddBody {
  action: "add";
  avaliacao_nome: string;
  nota_maxima: number;
  nota_obtida?: number | null;
}

export interface PatchNotasUpdateBody {
  action: "update";
  id: number;
  nota_obtida: number | null;
}

export type PatchNotasBody = PatchNotasAddBody | PatchNotasUpdateBody;

export interface PatchNotasResponse {
  evaluations: SubjectEvaluation[];
  grade: number | null;
}

export interface PatchTarefaBody {
  concluida: boolean;
}
