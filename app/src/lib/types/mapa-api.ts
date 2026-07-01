export type CourseMapStatus = "done" | "current" | "unlocked" | "locked";

export const COURSE_MAP_STATUS_LABELS: Record<CourseMapStatus, string> = {
  done: "Concluída",
  current: "Cursando",
  unlocked: "Desbloqueada",
  locked: "Trancada",
};

export interface CourseMapNode {
  code: string;
  /** Sigla legível derivada do nome (ex.: CALCUL, AEDI, INGII) — não o código PPC `01/1`. */
  shortLabel: string;
  name: string;
  ch: number;
  type: string | null;
  status: CourseMapStatus;
  /** Trava por pré-requisito ou por CH de integralização ainda não atingida. */
  blockedBy?: "prereq" | "ch";
  /** Horas de CH obrigatória (ou equivalente) que faltam para desbloquear. */
  chRemaining?: number;
}

export interface CourseMapPeriod {
  period: number;
  subjects: CourseMapNode[];
}

export interface MapaStats {
  total: number;
  done: number;
  current: number;
  unlocked: number;
  locked: number;
}

export interface MapaResponse {
  curso: string;
  statusLabels: Record<CourseMapStatus, string>;
  periods: CourseMapPeriod[];
  stats: MapaStats;
  /** False quando a tabela `historico` está vazia — mapa incompleto até sync do PDF. */
  historicoSynced: boolean;
}
