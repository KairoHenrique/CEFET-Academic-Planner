export interface PortalAlunoSnapshot {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestreEntrada: string | null;
  rg: number | null;
  status: string | null;
}

export interface PortalIntegralizacaoItem {
  tipoCh: string;
  concluido: number;
  pendente: number;
  totalNecessario: number | null;
}

export interface PortalIntegralizacaoResumo {
  totalCurriculo: number | null;
  percentIntegralizado: number | null;
}

export interface PortalDisciplinaSemestre {
  codigo: string;
  nome: string;
  local: string | null;
  codigoHorario: string | null;
  horarioTraduzido: string | null;
}

export interface PortalAtividadePendente {
  disciplinaCodigo: string;
  titulo: string;
  dataFim: string;
  horaFim: string | null;
  tipo: "individual" | "grupo" | null;
  descricao: string | null;
  linkId?: string | null;
  tipoLabel?: string | null;
  instrucoes?: string[];
  entregaveis?: string[];
}

export interface PortalDiscenteSnapshot {
  scrapedAt: string;
  aluno: PortalAlunoSnapshot;
  integralizacao: PortalIntegralizacaoItem[];
  integralizacaoResumo: PortalIntegralizacaoResumo;
  semestreAtual: PortalDisciplinaSemestre[];
  /** Semestre letivo inferido do portal (ex.: 2026.1). */
  semestreLetivo: string | null;
  atividades: PortalAtividadePendente[];
}

/** Dados brutos extraídos do DOM/HTML antes do parse tipado. */
export interface PortalPageRawData {
  labelPairs: Record<string, string>;
  tableRows: string[][];
  plainText: string;
  html?: string;
}
