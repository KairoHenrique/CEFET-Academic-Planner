export type GradeRiskZone = "safe" | "warning" | "danger" | "unknown";

export interface GradeRisk {
  zone: GradeRiskZone;
  label: string;
  pointsNeeded: number;
  passingGrade: number;
  currentTotal: number;
  /** 0–100: quão perto está da nota mínima de aprovação */
  passingProgress: number;
  /** Pontos ainda recuperáveis nas avaliações já distribuídas */
  remainingMax: number;
  canStillPass: boolean;
  /** Todos os 100 pts (sem extras) já foram cadastrados pelo professor */
  fullyDistributed?: boolean;
  /** Nota mínima sugerida na prova de recuperação */
  recoveryScoreNeeded?: number;
  recoveryScore?: number | null;
  recoveryAverage?: number;
  awaitingRecovery?: boolean;
}
