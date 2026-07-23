import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./src/config/mock/disciplinas_db.json'));
const reqs = db.flatMap(r => r.requisitos || []);
let edges = [];
let seen = new Set();
for (const row of reqs) {
  const kind = row.tipo === "co" ? "co" : "pre";
  const source = row.requisito_id;
  const target = row.disciplina_id;
  const id = `${kind}:${source}->${target}`;
  if (!seen.has(id)) {
    seen.add(id);
    edges.push({ id, source, target, kind });
  }
}
const connected = edges.filter(e => e.source === '03/5' || e.target === '03/5');
console.log(JSON.stringify(connected, null, 2));
