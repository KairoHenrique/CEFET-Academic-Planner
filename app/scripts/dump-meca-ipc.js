const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./app/src/config/mock/disciplinas_db_eng-mecatronica.json', 'utf8'));
const ipc = data.filter(d => d.disciplina.nome.toLowerCase().includes("program"));
console.log("MECA:", ipc.map(i => i.disciplina.nome));
