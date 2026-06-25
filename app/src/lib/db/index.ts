import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Inicializa o banco de dados. No futuro, esse caminho poderá ser configurado pelo usuário.
// Por padrão, cria na raiz do projeto (fora do escopo do Git)
const dbDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'planner.db');

const db = new Database(dbPath);

// Configurações recomendadas para performance no SQLite
db.pragma('journal_mode = WAL');

// Função de inicialização das tabelas (Run upon startup)
export function initDB() {
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
      manual INTEGER DEFAULT 0, -- booleano
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

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
}

export default db;
