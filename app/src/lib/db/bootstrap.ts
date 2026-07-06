import {
  getActiveDatabase,
  getActiveSigaaUsername,
  isDatabaseBootstrapped,
  markDatabaseBootstrapped,
  resetConnectionsForTests,
  resolveDbPathForUser,
} from "./connection-manager";
import { assertSqliteAllowed } from "./backend/sqlite-guard";
import { countDisciplinas } from "./queries";
import { seedPpcIfEmpty, syncPpcEmentasToDb } from "./seed-ppc";

type TableInfoRow = { name: string };

function columnExists(database: ReturnType<typeof getActiveDatabase>, table: string, column: string): boolean {
  const info = database.pragma(`table_info(${table})`) as TableInfoRow[];
  return info.some((row) => row.name === column);
}

function addColumnIfMissing(
  database: ReturnType<typeof getActiveDatabase>,
  table: string,
  column: string,
  definition: string
): void {
  if (!columnExists(database, table, column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(database: ReturnType<typeof getActiveDatabase>): void {
  addColumnIfMissing(database, "semestre_atual", "cor", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "apelido", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "nome_exibicao", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "local_exibicao", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "horario_exibicao", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "professor_exibicao", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "horas_semanais_exibicao", "INTEGER");
  addColumnIfMissing(database, "semestre_atual", "grupo_nome", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "professor", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "max_faltas", "INTEGER DEFAULT 15");
  addColumnIfMissing(database, "semestre_atual", "nota_maxima", "REAL DEFAULT 100");
  addColumnIfMissing(database, "semestre_atual", "nota_aprovacao", "REAL DEFAULT 60");
  addColumnIfMissing(database, "semestre_atual", "arquivos_baixados", "INTEGER DEFAULT 0");
  addColumnIfMissing(
    database,
    "semestre_atual",
    "pdf_auto_download",
    "INTEGER DEFAULT 0"
  );
  addColumnIfMissing(database, "semestre_atual", "turma_data_inicio", "TEXT");
  addColumnIfMissing(database, "semestre_atual", "turma_data_fim", "TEXT");
  addColumnIfMissing(database, "tarefas", "instrucoes", "TEXT");
  addColumnIfMissing(database, "tarefas", "entregaveis", "TEXT");
  addColumnIfMissing(database, "tarefas", "pontuacao_maxima", "REAL");
  addColumnIfMissing(database, "tarefas", "hora_fim", "TEXT DEFAULT '23:59'");
  addColumnIfMissing(database, "notas", "nota_override", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "notas", "nota_extra", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "faltas", "manual", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "faltas", "status_override", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "faltas", "quantidade", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "tarefas", "concluida_override", "INTEGER DEFAULT 0");
  addColumnIfMissing(database, "eventos_calendario", "data_fim", "TEXT");
  addColumnIfMissing(database, "eventos_calendario", "hora_inicio", "TEXT");
  addColumnIfMissing(database, "eventos_calendario", "hora_fim", "TEXT");
  addColumnIfMissing(
    database,
    "eventos_calendario",
    "recorrencia",
    "TEXT DEFAULT 'none'"
  );
  addColumnIfMissing(database, "eventos_calendario", "recorrencia_ate", "TEXT");
  addColumnIfMissing(database, "eventos_calendario", "recorrencia_dias", "TEXT");
  migrateEventosCalendarioTypes(database);
  ensureTurmasOfertadasTable(database);
  ensureSimuladorSimulacoesTable(database);
}

function ensureTurmasOfertadasTable(
  database: ReturnType<typeof getActiveDatabase>
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS turmas_ofertadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turma_sigaa_id TEXT NOT NULL,
      sigaa_componente TEXT,
      codigo_disciplina TEXT NOT NULL,
      nome TEXT NOT NULL,
      turma_codigo TEXT,
      semestre TEXT NOT NULL,
      codigo_horario TEXT,
      horario_exibicao TEXT,
      local TEXT,
      professor TEXT,
      vagas INTEGER,
      vagas_ocupadas INTEGER,
      carga_horaria INTEGER,
      situacao TEXT NOT NULL DEFAULT 'atendida',
      tipo_turma TEXT,
      departamento TEXT,
      horario_indefinido INTEGER NOT NULL DEFAULT 0,
      categoria TEXT,
      curso_id TEXT DEFAULT 'eng-computacao',
      synced_at TEXT,
      UNIQUE(turma_sigaa_id)
    );
  `);

  addColumnIfMissing(database, "turmas_ofertadas", "sigaa_componente", "TEXT");
  addColumnIfMissing(database, "turmas_ofertadas", "situacao", "TEXT DEFAULT 'atendida'");
  addColumnIfMissing(database, "turmas_ofertadas", "tipo_turma", "TEXT");
  addColumnIfMissing(database, "turmas_ofertadas", "departamento", "TEXT");
  addColumnIfMissing(
    database,
    "turmas_ofertadas",
    "horario_indefinido",
    "INTEGER NOT NULL DEFAULT 0"
  );
  addColumnIfMissing(database, "turmas_ofertadas", "categoria", "TEXT");
}

function ensureSimuladorSimulacoesTable(
  database: ReturnType<typeof getActiveDatabase>
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS simulador_simulacoes (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      semestre TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function migrateEventosCalendarioTypes(database: ReturnType<typeof getActiveDatabase>): void {
  const table = database
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'eventos_calendario'"
    )
    .get() as { sql: string } | undefined;

  if (!table?.sql.includes("'monitoria'")) {
    database.exec(`
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
  const database = getActiveDatabase();

  database.exec(`
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

    CREATE TABLE IF NOT EXISTS turmas_ofertadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turma_sigaa_id TEXT NOT NULL,
      sigaa_componente TEXT,
      codigo_disciplina TEXT NOT NULL,
      nome TEXT NOT NULL,
      turma_codigo TEXT,
      semestre TEXT NOT NULL,
      codigo_horario TEXT,
      horario_exibicao TEXT,
      local TEXT,
      professor TEXT,
      vagas INTEGER,
      vagas_ocupadas INTEGER,
      carga_horaria INTEGER,
      situacao TEXT NOT NULL DEFAULT 'atendida',
      tipo_turma TEXT,
      departamento TEXT,
      horario_indefinido INTEGER NOT NULL DEFAULT 0,
      categoria TEXT,
      curso_id TEXT DEFAULT 'eng-computacao',
      synced_at TEXT,
      UNIQUE(turma_sigaa_id)
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

    CREATE TABLE IF NOT EXISTS simulador_simulacoes (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      semestre TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  runMigrations(database);
}

export function ensureDbReady(): void {
  assertSqliteAllowed("bootstrap");
  const dbPath = resolveDbPathForUser(getActiveSigaaUsername());

  if (isDatabaseBootstrapped(dbPath)) {
    seedPpcIfEmpty();
    return;
  }

  initDB();
  seedPpcIfEmpty();
  if (countDisciplinas() > 0) {
    syncPpcEmentasToDb();
  }
  markDatabaseBootstrapped(dbPath);
}

export function resetDbBootstrapForTests(): void {
  resetConnectionsForTests();
}
