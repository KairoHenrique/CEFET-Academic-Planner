-- B39 — Schema Postgres inicial (espelho bootstrap.ts + split global/aluno)
-- Modo 6a: user_id NULL (sem auth); RLS na 6c. FK auth.users na 6b.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Catálogo global (sem user_id)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS disciplinas (
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  carga_horaria INTEGER,
  periodo INTEGER,
  ementa TEXT,
  PRIMARY KEY (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS requisitos (
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  requisito_id TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('pre', 'co')),
  PRIMARY KEY (curso_id, disciplina_id, requisito_id),
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo),
  FOREIGN KEY (curso_id, requisito_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS calendario_academico (
  id BIGSERIAL PRIMARY KEY,
  evento TEXT NOT NULL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT,
  semestre TEXT
);

CREATE TABLE IF NOT EXISTS turmas_ofertadas (
  id BIGSERIAL PRIMARY KEY,
  turma_sigaa_id TEXT NOT NULL UNIQUE,
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
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS app_config (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turmas_ofertadas_curso_semestre
  ON turmas_ofertadas (curso_id, semestre);

-- ---------------------------------------------------------------------------
-- Dados por aluno (user_id nullable na 6a)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS aluno (
  user_id UUID,
  matricula TEXT NOT NULL,
  nome TEXT NOT NULL,
  curso TEXT,
  email TEXT,
  semestre_entrada TEXT,
  rg DOUBLE PRECISION,
  status TEXT,
  PRIMARY KEY (user_id, matricula)
);

CREATE TABLE IF NOT EXISTS historico (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  semestre TEXT NOT NULL,
  status TEXT,
  nota_final DOUBLE PRECISION,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS semestre_atual (
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  local TEXT,
  codigo_horario TEXT,
  horario_traduzido TEXT,
  cor TEXT,
  apelido TEXT,
  nome_exibicao TEXT,
  local_exibicao TEXT,
  horario_exibicao TEXT,
  professor_exibicao TEXT,
  horas_semanais_exibicao INTEGER,
  grupo_nome TEXT,
  professor TEXT,
  max_faltas INTEGER DEFAULT 15,
  nota_maxima DOUBLE PRECISION DEFAULT 100,
  nota_aprovacao DOUBLE PRECISION DEFAULT 60,
  arquivos_baixados INTEGER DEFAULT 0,
  pdf_auto_download INTEGER DEFAULT 0,
  turma_data_inicio TEXT,
  turma_data_fim TEXT,
  PRIMARY KEY (user_id, curso_id, disciplina_id),
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS notas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  avaliacao_nome TEXT NOT NULL,
  nota_maxima DOUBLE PRECISION,
  nota_obtida DOUBLE PRECISION,
  manual INTEGER DEFAULT 0,
  nota_override INTEGER DEFAULT 0,
  nota_extra INTEGER DEFAULT 0,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS faltas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT CHECK (status IN ('presente', 'falta', 'nao_registrada')),
  manual INTEGER DEFAULT 0,
  status_override INTEGER DEFAULT 0,
  quantidade INTEGER DEFAULT 0,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS tarefas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  hora_fim TEXT DEFAULT '23:59',
  tipo TEXT CHECK (tipo IN ('individual', 'grupo')),
  possui_nota INTEGER DEFAULT 0,
  concluida INTEGER DEFAULT 0,
  manual INTEGER DEFAULT 0,
  concluida_override INTEGER DEFAULT 0,
  instrucoes TEXT,
  entregaveis TEXT,
  pontuacao_maxima DOUBLE PRECISION,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  disciplina_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  matricula TEXT,
  email TEXT,
  curso TEXT,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS integralizacao (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  tipo_ch TEXT NOT NULL,
  total_necessario INTEGER,
  concluido INTEGER,
  pendente INTEGER,
  manual INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS eventos_calendario (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  titulo TEXT NOT NULL,
  descricao TEXT,
  data TEXT NOT NULL,
  data_fim TEXT,
  hora_inicio TEXT,
  hora_fim TEXT,
  recorrencia TEXT DEFAULT 'none',
  recorrencia_ate TEXT,
  recorrencia_dias TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'aula', 'tarefa', 'prova', 'evento',
    'monitoria', 'estagio', 'estudo', 'outro'
  )),
  disciplina_id TEXT,
  cor TEXT,
  concluida INTEGER DEFAULT 0,
  manual INTEGER DEFAULT 1,
  FOREIGN KEY (curso_id, disciplina_id) REFERENCES disciplinas (curso_id, codigo)
);

CREATE TABLE IF NOT EXISTS configuracoes (
  user_id UUID,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  PRIMARY KEY (user_id, chave)
);

-- Índices tenant (6c: RLS em user_id)
CREATE INDEX IF NOT EXISTS idx_historico_user ON historico (user_id);
CREATE INDEX IF NOT EXISTS idx_semestre_atual_user ON semestre_atual (user_id);
CREATE INDEX IF NOT EXISTS idx_notas_user ON notas (user_id);
CREATE INDEX IF NOT EXISTS idx_faltas_user ON faltas (user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_user ON tarefas (user_id);
CREATE INDEX IF NOT EXISTS idx_grupo_membros_user ON grupo_membros (user_id);
CREATE INDEX IF NOT EXISTS idx_integralizacao_user ON integralizacao (user_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_user ON eventos_calendario (user_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_user ON configuracoes (user_id);
