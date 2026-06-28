import db from "./index";
import { countDisciplinas } from "./queries";
import { syncPpcEmentasToDb } from "./seed-ppc";

type TableInfoRow = { name: string };

function columnExists(table: string, column: string): boolean {
  const info = db.pragma(`table_info(${table})`) as TableInfoRow[];
  return info.some((row) => row.name === column);
}

function addColumnIfMissing(
  table: string,
  column: string,
  definition: string
): void {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(): void {
  addColumnIfMissing("semestre_atual", "cor", "TEXT");
  addColumnIfMissing("semestre_atual", "apelido", "TEXT");
  addColumnIfMissing("semestre_atual", "nome_exibicao", "TEXT");
  addColumnIfMissing("semestre_atual", "professor", "TEXT");
  addColumnIfMissing("semestre_atual", "max_faltas", "INTEGER DEFAULT 15");
  addColumnIfMissing("semestre_atual", "nota_maxima", "REAL DEFAULT 100");
  addColumnIfMissing("semestre_atual", "nota_aprovacao", "REAL DEFAULT 60");
  addColumnIfMissing("semestre_atual", "arquivos_baixados", "INTEGER DEFAULT 0");
  addColumnIfMissing(
    "semestre_atual",
    "pdf_auto_download",
    "INTEGER DEFAULT 0"
  );
  addColumnIfMissing("tarefas", "instrucoes", "TEXT");
  addColumnIfMissing("tarefas", "entregaveis", "TEXT");
  addColumnIfMissing("tarefas", "pontuacao_maxima", "REAL");
  addColumnIfMissing("tarefas", "hora_fim", "TEXT DEFAULT '23:59'");
  addColumnIfMissing("notas", "nota_override", "INTEGER DEFAULT 0");
  addColumnIfMissing("notas", "nota_extra", "INTEGER DEFAULT 0");
  addColumnIfMissing("faltas", "manual", "INTEGER DEFAULT 0");
  addColumnIfMissing("faltas", "status_override", "INTEGER DEFAULT 0");
  addColumnIfMissing("tarefas", "concluida_override", "INTEGER DEFAULT 0");
  migrateEventosCalendarioTypes();
}

function migrateEventosCalendarioTypes(): void {
  const table = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'eventos_calendario'"
    )
    .get() as { sql: string } | undefined;

  if (!table?.sql.includes("'monitoria'")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS eventos_calendario_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK( tipo IN (
          'aula', 'tarefa', 'prova', 'evento',
          'monitoria', 'estagio', 'estudo', 'outro'
        ) ),
        disciplina_id TEXT,
        cor TEXT,
        concluida INTEGER DEFAULT 0,
        manual INTEGER DEFAULT 1,
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
      );
      INSERT INTO eventos_calendario_new
        SELECT * FROM eventos_calendario;
      DROP TABLE eventos_calendario;
      ALTER TABLE eventos_calendario_new RENAME TO eventos_calendario;
    `);
  }
}

export function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS aluno (
      matricula TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      curso TEXT,
      email TEXT,
      semestre_entrada TEXT,
      rg REAL,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS disciplinas (
      codigo TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT,
      carga_horaria INTEGER,
      periodo INTEGER,
      ementa TEXT
    );

    CREATE TABLE IF NOT EXISTS requisitos (
      disciplina_id TEXT,
      requisito_id TEXT,
      tipo TEXT CHECK( tipo IN ('pre', 'co') ),
      PRIMARY KEY (disciplina_id, requisito_id),
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo),
      FOREIGN KEY (requisito_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina_id TEXT NOT NULL,
      semestre TEXT NOT NULL,
      status TEXT,
      nota_final REAL,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS semestre_atual (
      disciplina_id TEXT PRIMARY KEY,
      local TEXT,
      codigo_horario TEXT,
      horario_traduzido TEXT,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina_id TEXT NOT NULL,
      avaliacao_nome TEXT NOT NULL,
      nota_maxima REAL,
      nota_obtida REAL,
      manual INTEGER DEFAULT 0,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS faltas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina_id TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT CHECK( status IN ('presente', 'falta', 'nao_registrada') ),
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_inicio TEXT,
      data_fim TEXT,
      tipo TEXT CHECK( tipo IN ('individual', 'grupo') ),
      possui_nota INTEGER DEFAULT 0,
      concluida INTEGER DEFAULT 0,
      manual INTEGER DEFAULT 0,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS grupo_membros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      matricula TEXT,
      email TEXT,
      curso TEXT,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS integralizacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_ch TEXT NOT NULL,
      total_necessario INTEGER,
      concluido INTEGER,
      pendente INTEGER,
      manual INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS calendario_academico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evento TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_fim TEXT,
      semestre TEXT
    );

    CREATE TABLE IF NOT EXISTS eventos_calendario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK( tipo IN (
        'aula', 'tarefa', 'prova', 'evento',
        'monitoria', 'estagio', 'estudo', 'outro'
      ) ),
      disciplina_id TEXT,
      cor TEXT,
      concluida INTEGER DEFAULT 0,
      manual INTEGER DEFAULT 1,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(codigo)
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);

  runMigrations();
}

let bootstrapped = false;
let ppcEmentasSynced = false;

export function ensureDbReady(): void {
  if (bootstrapped) return;
  initDB();
  if (!ppcEmentasSynced && countDisciplinas() > 0) {
    syncPpcEmentasToDb();
    ppcEmentasSynced = true;
  }
  bootstrapped = true;
}

export function resetDbBootstrapForTests(): void {
  bootstrapped = false;
  ppcEmentasSynced = false;
}
