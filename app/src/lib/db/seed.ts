import db from './index';
import path from 'path';
import fs from 'fs';

// Inicializa tabelas
import { initDB } from './index';
initDB();

const dataPath = path.join(process.cwd(), 'src', 'config', 'mock', 'disciplinas_db.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

console.log('🌱 Iniciando Seed do Banco de Dados...');

const insertDisciplina = db.prepare(`
  INSERT INTO disciplinas (codigo, nome, tipo, carga_horaria, periodo, ementa)
  VALUES (@codigo, @nome, @tipo, @carga_horaria, @periodo, @ementa)
  ON CONFLICT(codigo) DO UPDATE SET
    nome=excluded.nome,
    tipo=excluded.tipo,
    carga_horaria=excluded.carga_horaria,
    periodo=excluded.periodo,
    ementa=excluded.ementa
`);

const insertRequisito = db.prepare(`
  INSERT INTO requisitos (disciplina_id, requisito_id, tipo)
  VALUES (@disciplina_id, @requisito_id, @tipo)
  ON CONFLICT(disciplina_id, requisito_id) DO NOTHING
`);

// Run transaction for safety
const seedTransaction = db.transaction(() => {
  // Pass 1: Insert all courses
  for (const item of data) {
    insertDisciplina.run(item.disciplina);
  }

  // Pass 2: Insert requirements
  for (const item of data) {
    for (const req of item.requisitos) {
      if (req.requisito_id !== '-') {
        try {
          insertRequisito.run(req);
        } catch (e) {
          console.warn(`Aviso: Requisito ${req.requisito_id} não encontrado para ${req.disciplina_id}. Ignorando.`);
        }
      }
    }
  }
});

seedTransaction();

console.log(`✅ Seed concluído! ${data.length} disciplinas inseridas no SQLite.`);
