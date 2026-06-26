export interface AlunoRow {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestre_entrada: string | null;
  rg: number | null;
  status: string | null;
}

export interface DisciplinaRow {
  codigo: string;
  nome: string;
  tipo: string | null;
  carga_horaria: number | null;
  periodo: number | null;
  ementa: string | null;
}

export interface RequisitoRow {
  disciplina_id: string;
  requisito_id: string;
  tipo: "pre" | "co";
}

export interface HistoricoRow {
  id: number;
  disciplina_id: string;
  semestre: string;
  status: string | null;
  nota_final: number | null;
}

export interface SemestreAtualRow {
  disciplina_id: string;
  local: string | null;
  codigo_horario: string | null;
  horario_traduzido: string | null;
  cor: string | null;
  professor: string | null;
  max_faltas: number | null;
  nota_maxima: number | null;
  nota_aprovacao: number | null;
  arquivos_baixados: number | null;
  pdf_auto_download: number | null;
}

export interface SemestreAtualWithDisciplina extends SemestreAtualRow {
  nome: string;
  carga_horaria: number | null;
}

export interface NotaRow {
  id: number;
  disciplina_id: string;
  avaliacao_nome: string;
  nota_maxima: number | null;
  nota_obtida: number | null;
  manual: number;
  nota_override?: number;
  nota_extra?: number;
}

export interface FaltaRow {
  id: number;
  disciplina_id: string;
  data: string;
  status: "presente" | "falta" | "nao_registrada";
}

export interface TarefaRow {
  id: number;
  disciplina_id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  hora_fim?: string | null;
  tipo: "individual" | "grupo" | null;
  possui_nota: number;
  concluida: number;
  manual: number;
  instrucoes: string | null;
  entregaveis: string | null;
  pontuacao_maxima: number | null;
}

export interface GrupoMembroRow {
  id: number;
  disciplina_id: string;
  nome: string;
  matricula: string | null;
  email: string | null;
  curso: string | null;
}

export interface IntegralizacaoRow {
  id: number;
  tipo_ch: string;
  total_necessario: number | null;
  concluido: number | null;
  pendente: number | null;
  manual: number;
}

export interface CalendarioAcademicoRow {
  id: number;
  evento: string;
  data_inicio: string;
  data_fim: string | null;
  semestre: string | null;
}
