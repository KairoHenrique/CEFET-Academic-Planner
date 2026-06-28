import type { Subject, SubjectEvaluation } from "./subject";
import type { GradeRisk } from "./grade-risk";
import type { AcademicTask } from "./task";
import type { AttendanceSummary } from "./attendance";

export interface SubjectListItem {
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
  ch?: number;
  professor?: string;
  schedule?: string;
}

export type DisciplinaListFilter =
  | "todas"
  | "com_tarefas"
  | "risco_faltas"
  | "risco"
  | "critico"
  | "aprovados";

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
  nota_extra?: boolean;
}

export interface PatchNotasUpdateBody {
  action: "update";
  id: number;
  nota_obtida: number | null;
}

export interface PatchNotasUpdateManualBody {
  action: "update_manual";
  id: number;
  avaliacao_nome?: string;
  nota_maxima?: number;
  nota_obtida?: number | null;
  nota_extra?: boolean;
}

export interface PatchNotasDeleteBody {
  action: "delete";
  id: number;
}

export type PatchNotasBody =
  | PatchNotasAddBody
  | PatchNotasUpdateBody
  | PatchNotasUpdateManualBody
  | PatchNotasDeleteBody;

export interface PatchNotasResponse {
  evaluations: SubjectEvaluation[];
  grade: number | null;
}

export interface PatchTarefaToggleBody {
  action: "toggle";
  concluida: boolean;
}

export interface PatchTarefaUpdateBody {
  action: "update";
  titulo?: string;
  descricao?: string;
  data_fim?: string;
  hora_fim?: string;
  tipo?: "individual" | "grupo";
  possui_nota?: boolean;
  concluida?: boolean;
  pontuacao_maxima?: number | null;
}

export interface PatchTarefaDeleteBody {
  action: "delete";
}

export type PatchTarefaBody =
  | PatchTarefaToggleBody
  | PatchTarefaUpdateBody
  | PatchTarefaDeleteBody;

export interface CreateTarefaBody {
  titulo: string;
  descricao?: string;
  data_fim: string;
  hora_fim?: string;
  tipo?: "individual" | "grupo";
  possui_nota?: boolean;
  pontuacao_maxima?: number | null;
  instrucoes?: string[];
  entregaveis?: string[];
}

export interface PatchFaltaUpdateBody {
  action: "update";
  id: number;
  status: "presente" | "falta" | "nao_registrada";
}

export type PatchFaltaBody = PatchFaltaUpdateBody;

export interface PatchFaltaResponse {
  attendance: AttendanceSummary;
  absences: number;
}

export interface PatchDisciplinaAppearanceBody {
  color: string;
}

export interface PatchDisciplinaAppearanceResponse {
  code: string;
  color: string;
}
