const fs = require('fs');
const path = require('path');
const { normalizeCefetCh } = require('./cefet-ch-normalize');

const dataPath = path.join(__dirname, 'ppc_data.txt');
const outPath = path.join(__dirname, '..', 'src', 'config', 'mock', 'disciplinas_db.json');

const lines = fs.readFileSync(dataPath, 'utf-8')
  .split('\n')
  .filter((l) => l.trim() !== '' && !l.trim().startsWith('#'));

const disciplinas = [];

for (const line of lines) {
  const parts = line.split('\t');
  if (parts.length < 9) continue;

  const periodoRaw = parts[0].trim();
  const codigoRaw = parts[1].trim();
  const nome = parts[2].trim();
  const chHorasRaw = parts[5].trim();
  const preReqRaw = parts[7].trim();
  const coReqRaw = parts[8].trim();

  const periodo = parseInt(periodoRaw.replace('º', ''), 10);
  
  let codigo = codigoRaw;
  if (codigo === '-') {
    if (nome.includes('PFC 1')) codigo = 'PFC1';
    else if (nome.includes('PFC 2')) codigo = 'PFC2';
    else if (nome.includes('Estágio')) codigo = 'ESTAGIO';
  }

  const carga_horaria = normalizeCefetCh(parseFloat(chHorasRaw));

  const disciplina = {
    codigo,
    nome,
    tipo: 'Obrigatória',
    carga_horaria,
    periodo,
    ementa: 'A definir'
  };

  const requisitos = [];

  if (preReqRaw !== '-' && preReqRaw !== '') {
    const pres = preReqRaw.split(' ');
    for (const p of pres) {
      if (p.trim()) requisitos.push({ disciplina_id: codigo, requisito_id: p.trim(), tipo: 'pre' });
    }
  }

  if (coReqRaw !== '-' && coReqRaw !== '') {
    const cos = coReqRaw.split(' ');
    for (const c of cos) {
      if (c.trim()) requisitos.push({ disciplina_id: codigo, requisito_id: c.trim(), tipo: 'co' });
    }
  }

  disciplinas.push({ disciplina, requisitos });
}

fs.writeFileSync(outPath, JSON.stringify(disciplinas, null, 2));
console.log(`Foram parseadas ${disciplinas.length} disciplinas com sucesso! Salvo em ${outPath}`);
