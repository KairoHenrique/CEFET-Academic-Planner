const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./app/src/config/mock/disciplinas_db.json', 'utf8'));
const ipc = data.find(d => d.disciplina.nome.toLowerCase().includes("program"));
console.log("IPC CODE:", ipc.disciplina.codigo, "| NOME:", ipc.disciplina.nome);
