import type { AcademicTask } from "./task";
import type { IntegrationCategory } from "./integration";
import type { SubjectSummary } from "./subject";

export interface DashboardAluno {
  matricula: string;
  nome: string;
  curso: string;
  email: string;
  semestreAtual: string;
  rg: number;
  status: string;
}

export interface DashboardStats {
  rg: number;
  integralizacaoPercent: number;
  disciplinasCursando: number;
  tarefasPendentes: number;
}

export interface DashboardIntegralizacao {
  totalHours: number;
  totalDone: number;
  percent: number;
  categories: IntegrationCategory[];
}

export interface DashboardResponse {
  aluno: DashboardAluno;
  stats: DashboardStats;
  integralizacao: DashboardIntegralizacao;
  tarefas: AcademicTask[];
  disciplinas: SubjectSummary[];
  /** Saldo do cartão do RU (Refeições Disponíveis). */
  ru?: {
    refeicoesDisponiveis: number | null;
    updatedAt: string | null;
  } | null;
}
