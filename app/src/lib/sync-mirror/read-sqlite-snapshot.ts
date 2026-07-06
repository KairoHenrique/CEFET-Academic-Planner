import fs from "node:fs";
import BetterSqlite3 from "better-sqlite3";
import { resolveDbPathForUser } from "@/lib/db/connection-manager";
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

function withReadonlyDb<T>(
  username: string,
  reader: (db: BetterSqlite3.Database) => T
): T | null {
  const dbPath = resolveDbPathForUser(username);
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
  try {
    return reader(db);
  } finally {
    db.close();
  }
}

/** Lê o staging SQLite do usuário (somente leitura, fora do guard cloud). */
export function readUserSqliteSnapshot(
  username: string
): UserSqliteSnapshot | null {
  return withReadonlyDb(username, (db) => ({
    aluno: db.prepare("SELECT * FROM aluno LIMIT 1").get() as
      | AlunoRow
      | undefined,
    disciplinas: db
      .prepare("SELECT * FROM disciplinas")
      .all() as DisciplinaRow[],
    requisitos: db.prepare("SELECT * FROM requisitos").all() as RequisitoRow[],
    historico: db
      .prepare(
        "SELECT disciplina_id, semestre, status, nota_final FROM historico"
      )
      .all() as Array<Omit<HistoricoRow, "id">>,
    semestreAtual: db
      .prepare("SELECT * FROM semestre_atual")
      .all() as SemestreAtualRow[],
    notasSynced: db
      .prepare("SELECT * FROM notas WHERE manual = 0")
      .all() as NotaRow[],
    faltasSynced: db
      .prepare("SELECT * FROM faltas WHERE manual = 0")
      .all() as FaltaRow[],
    tarefasSynced: db
      .prepare("SELECT * FROM tarefas WHERE manual = 0")
      .all() as TarefaRow[],
    grupoMembros: db
      .prepare(
        "SELECT disciplina_id, nome, matricula, email, curso FROM grupo_membros"
      )
      .all() as Array<Omit<GrupoMembroRow, "id">>,
    integralizacaoSynced: db
      .prepare(
        `SELECT tipo_ch, total_necessario, concluido, pendente, manual
         FROM integralizacao WHERE manual = 0`
      )
      .all() as Array<Omit<IntegralizacaoRow, "id">>,
    config: db
      .prepare(
        `SELECT chave, valor FROM configuracoes
         WHERE chave IN (${MIRROR_CONFIG_KEYS.map(() => "?").join(", ")})`
      )
      .all(...MIRROR_CONFIG_KEYS) as Array<{ chave: string; valor: string }>,
  }));
}

/** Catálogo global (calendário + turmas ofertadas) do staging do usuário. */
export function readGlobalSqliteSnapshot(
  username: string
): GlobalSqliteSnapshot | null {
  return withReadonlyDb(username, (db) => ({
    calendario: db
      .prepare(
        "SELECT evento, data_inicio, data_fim, semestre FROM calendario_academico"
      )
      .all() as Array<Omit<CalendarioAcademicoRow, "id">>,
    turmasOfertadas: db
      .prepare(
        `SELECT turma_sigaa_id, sigaa_componente, codigo_disciplina, nome,
                turma_codigo, semestre, codigo_horario, horario_exibicao,
                local, professor, vagas, vagas_ocupadas, carga_horaria,
                situacao, tipo_turma, departamento, horario_indefinido,
                categoria, curso_id, synced_at
         FROM turmas_ofertadas`
      )
      .all() as Array<Omit<TurmaOfertadaRow, "id">>,
  }));
}
