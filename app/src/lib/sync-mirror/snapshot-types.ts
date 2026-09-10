import type {
  AlunoRow,
  CalendarioAcademicoRow,
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  RequisitoRow,
  SemestreAtualRow,
  TarefaRow,
  TurmaOfertadaRow,
} from "@/lib/types/db";

/** Chaves de config replicadas à cloud — nunca credenciais (LGPD/B71). */
export const MIRROR_CONFIG_KEYS = [
  "sync.last_at",
  "sync.historico_at",
  "sync.calendario_at",
  "sync.turmas_at",
  "sigaa.ch.total_curriculo",
  "sigaa.ch.percent_integralizado",
  "sigaa.ch.total_integralizado",
  "sigaa.ch.from_historico_pdf",
] as const;

export interface UserSqliteSnapshot {
  aluno: AlunoRow | undefined;
  disciplinas: DisciplinaRow[];
  requisitos: RequisitoRow[];
  historico: Array<Omit<HistoricoRow, "id">>;
  semestreAtual: SemestreAtualRow[];
  notasSynced: NotaRow[];
  faltasSynced: FaltaRow[];
  tarefasSynced: TarefaRow[];
  grupoMembros: Array<Omit<GrupoMembroRow, "id">>;
  integralizacaoSynced: Array<Omit<IntegralizacaoRow, "id">>;
  config: Array<{ chave: string; valor: string }>;
}

export interface GlobalSqliteSnapshot {
  calendario: Array<Omit<CalendarioAcademicoRow, "id">>;
  turmasOfertadas: Array<Omit<TurmaOfertadaRow, "id">>;
}
