import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./src/config/mock/disciplinas_db.json'));
const reqs = db.flatMap(r => r.requisitos || []);
for (const row of reqs) {
  if (row.tipo === 'pre' && (
      row.disciplina_id === '01/2' || row.requisito_id === '01/2' ||
      row.disciplina_id === '03/5' || row.requisito_id === '03/5' ||
      row.disciplina_id === '03/2' || row.requisito_id === '03/2'
  )) {
    console.log(`${row.requisito_id} is PRE for ${row.disciplina_id}`);
  }
}
