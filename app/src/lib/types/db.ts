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
  apelido: string | null;
  nome_exibicao: string | null;
  local_exibicao: string | null;
  horario_exibicao: string | null;
  professor_exibicao: string | null;
  horas_semanais_exibicao: number | null;
  grupo_nome: string | null;
  professor: string | null;
  max_faltas: number | null;
  nota_maxima: number | null;
  nota_aprovacao: number | null;
  arquivos_baixados: number | null;
  pdf_auto_download: number | null;
  turma_data_inicio: string | null;
  turma_data_fim: string | null;
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
  quantidade?: number;
  manual?: number;
  status_override?: number;
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
  concluida_override?: number;
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

export interface TurmaOfertadaRow {
  id: number;
  turma_sigaa_id: string;
  sigaa_componente: string | null;
  codigo_disciplina: string;
  nome: string;
  turma_codigo: string | null;
  semestre: string;
  codigo_horario: string | null;
  horario_exibicao: string | null;
  local: string | null;
  professor: string | null;
  vagas: number | null;
  vagas_ocupadas: number | null;
  carga_horaria: number | null;
  situacao: string;
  tipo_turma: string | null;
  departamento: string | null;
  horario_indefinido: number;
  categoria: string | null;
  curso_id: string | null;
  synced_at: string | null;
}

export type EventoCalendarioRecorrencia = "none" | "daily" | "weekly";

export interface EventoCalendarioRow {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  recorrencia: EventoCalendarioRecorrencia;
  recorrencia_ate: string | null;
  recorrencia_dias: string | null;
  tipo: "aula" | "tarefa" | "prova" | "evento" | "monitoria" | "estagio" | "estudo" | "outro";
  disciplina_id: string | null;
  cor: string | null;
  concluida: number;
  manual: number;
  disciplina_nome?: string | null;
  disciplina_apelido?: string | null;
}

export interface TarefaCalendarRow extends TarefaRow {
  disciplina_nome: string;
  disciplina_apelido?: string | null;
  cor: string | null;
}
