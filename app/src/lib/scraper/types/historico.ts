/** Entrada de componente curricular no histórico escolar do SIGAA. */
export interface HistoricoDisciplinaEntry {
  /** Código SIGAA — ex: G05CFVR1.01 */
  codigo: string;
  /** Nome da disciplina — ex: CÁLCULO COM FUNÇÕES DE UMA VARIÁVEL REAL */
  nome: string;
  /** Semestre letivo — ex: 2024.1 */
  semestre: string;
  /** Horas aula — ex: 90 */
  horaAula: number;
  /** Carga horária — ex: 75 */
  ch: number;
  /** Frequência em % — null se MATR/TRANC (--) */
  frequencia: number | null;
  /** Média final — null se MATR/TRANC (--) */
  media: number | null;
  /** Conceito — A/B/C/D/E/F ou null */
  conceito: string | null;
  /** Situação — APR, REP, REPMF, REPF, TRANC, MATR, DISP, CANC, etc. */
  situacao: string;
  /** Se marcado como optativo (* no PDF) */
  optativo: boolean;
}

/** Resumo de CH integralizada/pendente por tipo. */
export interface HistoricoChResumo {
  tipo: string;
  exigido: number;
  integralizado: number;
  pendente: number;
}

/** Snapshot completo do histórico escolar extraído do PDF do SIGAA. */
export interface HistoricoSnapshot {
  scrapedAt: string;
  disciplinas: HistoricoDisciplinaEntry[];
  chResumo: HistoricoChResumo[];
}
