export interface TurmaVirtualNota {
  avaliacaoNome: string;
  notaMaxima: number | null;
  notaObtida: number | null;
}

export interface TurmaVirtualFalta {
  data: string;
  status: "presente" | "falta" | "nao_registrada";
  /** Número de faltas na aula (ex.: "2 Falta(s)" → 2). */
  quantidade?: number;
}

export interface TurmaVirtualGrupoMembro {
  nome: string;
  matricula: string | null;
  email: string | null;
  curso: string | null;
}

export interface TurmaVirtualGrupoParseResult {
  nomeGrupo: string | null;
  membros: TurmaVirtualGrupoMembro[];
}

export interface TurmaVirtualTarefa {
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  horaFim: string | null;
  tipo: "individual" | "grupo" | null;
  possuiNota: boolean;
  pontuacaoMaxima: number | null;
  instrucoes: string[];
  entregaveis: string[];
  downloadUrls: string[];
}

export interface TurmaVirtualDisciplinaSnapshot {
  sigaaNome: string;
  sigaaUrl: string | null;
  professor: string | null;
  maxFaltas: number | null;
  notas: TurmaVirtualNota[];
  faltas: TurmaVirtualFalta[];
  grupoNome: string | null;
  grupo: TurmaVirtualGrupoMembro[];
  tarefas: TurmaVirtualTarefa[];
  scrapeWarnings: string[];
}

export interface TurmaVirtualSnapshot {
  scrapedAt: string;
  disciplinas: TurmaVirtualDisciplinaSnapshot[];
}

export interface TurmaVirtualIndexEntry {
  sigaaNome: string;
  sigaaUrl: string;
}

/** HTML bruto de subpáginas da turma virtual antes do parse tipado. */
export interface TurmaVirtualDisciplinaRawPages {
  sigaaNome: string;
  sigaaUrl: string | null;
  notasHtml: string | null;
  frequenciaHtml: string | null;
  grupoHtml: string | null;
  tarefasHtml: string | null;
  tarefaDetalhesHtml: Record<string, string>;
}

export interface TurmaVirtualPageRawData {
  tableRows: string[][];
  plainText: string;
  titleByCell: Record<string, string>;
  linkHrefs: Array<{ label: string; href: string }>;
}
