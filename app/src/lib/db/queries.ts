import db from './index';

// --- ALUNO ---
export function getAluno() {
  const stmt = db.prepare('SELECT * FROM aluno LIMIT 1');
  return stmt.get();
}

export function saveAluno(aluno: any) {
  const stmt = db.prepare(`
    INSERT INTO aluno (matricula, nome, curso, email, semestre_entrada, rg, status)
    VALUES (@matricula, @nome, @curso, @email, @semestre_entrada, @rg, @status)
    ON CONFLICT(matricula) DO UPDATE SET
      nome=excluded.nome,
      curso=excluded.curso,
      email=excluded.email,
      semestre_entrada=excluded.semestre_entrada,
      rg=excluded.rg,
      status=excluded.status
  `);
  return stmt.run(aluno);
}

// --- DISCIPLINAS ---
export function getDisciplinas() {
  const stmt = db.prepare('SELECT * FROM disciplinas');
  return stmt.all();
}

export function saveDisciplina(disciplina: any) {
  const stmt = db.prepare(`
    INSERT INTO disciplinas (codigo, nome, tipo, carga_horaria, periodo, ementa)
    VALUES (@codigo, @nome, @tipo, @carga_horaria, @periodo, @ementa)
    ON CONFLICT(codigo) DO UPDATE SET
      nome=excluded.nome,
      tipo=excluded.tipo,
      carga_horaria=excluded.carga_horaria,
      periodo=excluded.periodo,
      ementa=excluded.ementa
  `);
  return stmt.run(disciplina);
}

// --- INTEGRALIZAÇÃO ---
export function getIntegralizacao() {
  const stmt = db.prepare('SELECT * FROM integralizacao');
  return stmt.all();
}

export function saveIntegralizacao(progresso: any) {
  const stmt = db.prepare(`
    INSERT INTO integralizacao (tipo_ch, total_necessario, concluido, pendente, manual)
    VALUES (@tipo_ch, @total_necessario, @concluido, @pendente, @manual)
  `);
  return stmt.run(progresso);
}

export function clearIntegralizacao() {
  const stmt = db.prepare('DELETE FROM integralizacao WHERE manual = 0');
  return stmt.run();
}

// --- TAREFAS ---
export function getTarefasPendentes() {
  const stmt = db.prepare(`
    SELECT t.*, d.nome as disciplina_nome, d.codigo as disciplina_codigo 
    FROM tarefas t 
    JOIN disciplinas d ON t.disciplina_id = d.codigo 
    WHERE t.concluida = 0
    ORDER BY t.data_inicio ASC
  `);
  return stmt.all();
}

export function saveTarefa(tarefa: any) {
  const stmt = db.prepare(`
    INSERT INTO tarefas (disciplina_id, titulo, descricao, data_inicio, data_fim, tipo, possui_nota, concluida, manual)
    VALUES (@disciplina_id, @titulo, @descricao, @data_inicio, @data_fim, @tipo, @possui_nota, @concluida, @manual)
  `);
  return stmt.run(tarefa);
}

// --- CONFIGURAÇÕES ---
export function getConfig(chave: string) {
  const stmt = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?');
  const result = stmt.get(chave) as { valor: string } | undefined;
  return result ? result.valor : null;
}

export function setConfig(chave: string, valor: string) {
  const stmt = db.prepare(`
    INSERT INTO configuracoes (chave, valor)
    VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor
  `);
  return stmt.run(chave, valor);
}
