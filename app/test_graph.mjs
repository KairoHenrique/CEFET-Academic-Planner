import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./src/config/mock/disciplinas_db.json'));
const requisitos = db.flatMap(r => r.requisitos || []);
for (const row of requisitos) {
  if (row.disciplina_id === '03/5' && row.requisito_id === '01/2') console.log('03/5 reqs 01/2:', row);
  if (row.disciplina_id === '01/2' && row.requisito_id === '03/5') console.log('01/2 reqs 03/5:', row);
  if (row.disciplina_id === '03/5' && row.tipo === 'pre') console.log('03/5 has PRE:', row);
  if (row.disciplina_id === '01/2' && row.tipo === 'pre' && row.requisito_id === '03/5') console.log('01/2 has PRE:', row);
}
