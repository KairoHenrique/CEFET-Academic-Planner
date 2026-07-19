/**
 * Gera TSV + JSON de seed para Eng. Mecatrônica e Design de Moda.
 * Fonte: texto extraído dos PDFs em docs/referencias/ (tmp-ppc-*.txt) + grades curadas.
 *
 * Uso: node scripts/build-multi-ppc-seeds.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { normalizeCefetCh } = require("./cefet-ch-normalize.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockDir = path.join(__dirname, "..", "src", "config", "mock");

function normalizeCode(raw) {
  const cleaned = String(raw).trim().replace(/\./g, "/").replace(/\s+/g, "");
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return cleaned;
  const seq = m[1].padStart(2, "0");
  const eixo = String(Number(m[2]));
  return `${seq}/${eixo}`;
}

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function writeTsv(fileName, rows, headerComment) {
  const lines = [
    headerComment,
    "# Colunas: período | código | nome | T | P | CH horas | hora-aula | pré-req | co-req",
    ...rows.map((r) =>
      [
        `${r.periodo}º`,
        r.codigo,
        r.nome,
        r.t || "X",
        r.p || "",
        String(r.ch),
        String(r.ha ?? Math.round((r.ch * 5) / 4)),
        r.pre.length ? r.pre.join(" ") : "-",
        r.co.length ? r.co.join(" ") : "-",
      ].join("\t")
    ),
  ];
  const out = path.join(__dirname, fileName);
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  return out;
}

function parseTsvToJson(tsvPath, jsonName, tipoDefault = "Obrigatória") {
  const lines = fs
    .readFileSync(tsvPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));

  const disciplinas = [];
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 9) continue;

    const periodo = parseInt(parts[0].trim().replace("º", ""), 10);
    let codigo = parts[1].trim();
    const nome = parts[2].trim();
    const chHorasRaw = parts[5].trim();
    const preReqRaw = parts[7].trim();
    const coReqRaw = parts[8].trim();
    const tipo = parts[9]?.trim() || tipoDefault;

    if (codigo === "-") {
      if (nome.includes("PFC 1") || nome.includes("TCC 1") || /TCC\s*I\b/i.test(nome))
        codigo = "PFC1";
      else if (nome.includes("PFC 2") || nome.includes("TCC 2") || /TCC\s*II\b/i.test(nome))
        codigo = "PFC2";
      else if (/Estágio/i.test(nome)) codigo = "ESTAGIO";
    }

    const carga_horaria = normalizeCefetCh(parseFloat(chHorasRaw));
    const requisitos = [];

    if (preReqRaw !== "-" && preReqRaw !== "") {
      for (const p of preReqRaw.split(/\s+/)) {
        if (p.trim())
          requisitos.push({
            disciplina_id: codigo,
            requisito_id: p.trim(),
            tipo: "pre",
          });
      }
    }
    if (coReqRaw !== "-" && coReqRaw !== "") {
      for (const c of coReqRaw.split(/\s+/)) {
        if (c.trim())
          requisitos.push({
            disciplina_id: codigo,
            requisito_id: c.trim(),
            tipo: "co",
          });
      }
    }

    disciplinas.push({
      disciplina: {
        codigo,
        nome,
        tipo,
        carga_horaria,
        periodo,
        ementa: "A definir",
      },
      requisitos,
    });
  }

  const outPath = path.join(mockDir, jsonName);
  fs.writeFileSync(outPath, JSON.stringify(disciplinas, null, 2));
  return { outPath, count: disciplinas.length };
}

/** Grade obrigatória Eng. Mecatrônica — Quadro 14 (PPC revisado). Códigos normalizados seq/eixo. */
const MECA_ROWS = [
  // 1º
  { periodo: 1, codigo: "01/1", nome: "Leitura e Produção de Textos Acadêmicos", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "01/3", nome: "Cálculo com Funções de uma Variável Real", ch: 75, pre: [], co: [] },
  { periodo: 1, codigo: "02/3", nome: "Geometria Analítica e Álgebra Linear", ch: 50, pre: [], co: [] },
  { periodo: 1, codigo: "01/4", nome: "Programação de Computadores I", ch: 25, pre: [], co: ["02/4"] },
  { periodo: 1, codigo: "02/4", nome: "Laboratório de Programação de Computadores I", ch: 25, pre: [], co: ["01/4"] },
  { periodo: 1, codigo: "01/8", nome: "Laboratório de Desenho Técnico", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "01/12", nome: "Contexto Social e Profissional da Engenharia Mecatrônica", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "01/5", nome: "Sistemas Digitais I", ch: 25, pre: [], co: ["02/5"] },
  { periodo: 1, codigo: "02/5", nome: "Laboratório de Sistemas Digitais I", ch: 25, pre: [], co: ["01/5"] },
  { periodo: 1, codigo: "02/1", nome: "Introdução à Sociologia", ch: 25, pre: [], co: [] },
  // 2º
  { periodo: 2, codigo: "01/2", nome: "Fundamentos de Mecânica", ch: 50, pre: ["01/3", "02/3"], co: [] },
  { periodo: 2, codigo: "02/12", nome: "Planejamento e Prática de Experimentos", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "03/3", nome: "Integração e Séries", ch: 50, pre: ["01/3"], co: [] },
  { periodo: 2, codigo: "03/4", nome: "Programação de Computadores II", ch: 25, pre: ["01/4"], co: [] },
  { periodo: 2, codigo: "04/4", nome: "Laboratório de Programação de Computadores II", ch: 25, pre: ["02/4"], co: ["03/4"] },
  { periodo: 2, codigo: "03/5", nome: "Sistemas Digitais II", ch: 25, pre: ["01/5"], co: ["04/5"] },
  { periodo: 2, codigo: "04/5", nome: "Laboratório de Sistemas Digitais II", ch: 25, pre: [], co: ["03/5"] },
  { periodo: 2, codigo: "04/3", nome: "Cálculo com Funções de Várias Variáveis I", ch: 50, pre: ["01/3"], co: [] },
  { periodo: 2, codigo: "03/12", nome: "Metodologia Científica", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "03/1", nome: "Filosofia da Tecnologia", ch: 25, pre: [], co: [] },
  // 3º
  { periodo: 3, codigo: "05/3", nome: "Equações Diferenciais Ordinárias", ch: 50, pre: ["03/3", "04/3"], co: [] },
  { periodo: 3, codigo: "01/9", nome: "Análise Estrutural", ch: 50, pre: ["01/2"], co: [] },
  { periodo: 3, codigo: "02/2", nome: "Física Experimental - MOFT", ch: 25, pre: ["01/2"], co: ["03/2"] },
  { periodo: 3, codigo: "03/2", nome: "Fundamentos de Oscilações, Fluidos e Termodinâmica (OFT)", ch: 50, pre: ["01/2"], co: ["05/3", "02/2"] },
  { periodo: 3, codigo: "06/3", nome: "Estatística", ch: 50, pre: ["03/3"], co: [] },
  { periodo: 3, codigo: "05/5", nome: "Microprocessadores e Microcontroladores", ch: 25, pre: ["03/5"], co: ["06/5"] },
  { periodo: 3, codigo: "06/5", nome: "Laboratório de Microprocessadores e Microcontroladores", ch: 25, pre: [], co: ["05/5"] },
  { periodo: 3, codigo: "07/3", nome: "Cálculo com Funções de Várias Variáveis II", ch: 50, pre: ["04/3", "03/3"], co: [] },
  // 4º
  { periodo: 4, codigo: "02/9", nome: "Modelagem de Sistemas Mecatrônicos e Vibrações", ch: 50, pre: ["03/2", "05/3"], co: [] },
  { periodo: 4, codigo: "08/3", nome: "Métodos Numéricos Computacionais", ch: 50, pre: ["01/4", "02/4", "05/3"], co: [] },
  { periodo: 4, codigo: "03/9", nome: "Mecânica dos Sólidos I", ch: 50, pre: ["01/9"], co: [] },
  { periodo: 4, codigo: "04/2", nome: "Fundamentos de Eletromagnetismo", ch: 50, pre: ["07/3", "03/2"], co: ["05/2"] },
  { periodo: 4, codigo: "05/2", nome: "Física Experimental - Eletromagnetismo", ch: 25, pre: [], co: ["04/2"] },
  { periodo: 4, codigo: "02/8", nome: "Metrologia", ch: 25, pre: ["06/3"], co: ["03/8"] },
  { periodo: 4, codigo: "03/8", nome: "Laboratório de Metrologia", ch: 25, pre: [], co: ["02/8"] },
  { periodo: 4, codigo: "04/8", nome: "Sistemas Hidráulicos e Pneumáticos", ch: 25, pre: ["03/2"], co: ["05/8"] },
  { periodo: 4, codigo: "05/8", nome: "Laboratório de Sistemas Hidráulicos e Pneumáticos", ch: 25, pre: [], co: ["04/8"] },
  // 5º
  { periodo: 5, codigo: "01/7", nome: "Sinais e Sistemas", ch: 50, pre: ["05/3"], co: [] },
  { periodo: 5, codigo: "04/9", nome: "Mecânica Aplicada", ch: 50, pre: ["01/9"], co: [] },
  { periodo: 5, codigo: "05/9", nome: "Mecânica dos Sólidos II", ch: 50, pre: ["03/9"], co: [] },
  { periodo: 5, codigo: "01/6", nome: "Circuitos Elétricos", ch: 50, pre: ["04/2"], co: ["02/6"] },
  { periodo: 5, codigo: "02/6", nome: "Laboratório de Circuitos Elétricos", ch: 25, pre: [], co: ["01/6"] },
  { periodo: 5, codigo: "01/11", nome: "Termodinâmica", ch: 50, pre: ["03/2"], co: [] },
  { periodo: 5, codigo: "01/10", nome: "Engenharia de Materiais", ch: 50, pre: [], co: ["02/10"] },
  { periodo: 5, codigo: "02/10", nome: "Laboratório de Engenharia de Materiais", ch: 25, pre: [], co: ["01/10"] },
  // 6º
  { periodo: 6, codigo: "06/9", nome: "Cinemática e Dinâmica das Máquinas", ch: 50, pre: ["05/9"], co: [] },
  { periodo: 6, codigo: "07/9", nome: "Elementos de Máquinas", ch: 50, pre: ["05/9"], co: [] },
  { periodo: 6, codigo: "03/6", nome: "Eletrônica Analógica", ch: 50, pre: ["01/6"], co: ["04/6"] },
  { periodo: 6, codigo: "04/6", nome: "Laboratório de Eletrônica Analógica", ch: 25, pre: ["02/6"], co: ["03/6"] },
  { periodo: 6, codigo: "03/10", nome: "Tecnologia de Fabricação Mecânica I", ch: 25, pre: ["01/10", "02/10"], co: ["04/10"] },
  { periodo: 6, codigo: "04/10", nome: "Laboratório de Tecnologia de Fabricação Mecânica I", ch: 25, pre: ["01/10", "02/10"], co: ["03/10"] },
  { periodo: 6, codigo: "02/11", nome: "Fenômenos de Transporte", ch: 50, pre: ["01/11"], co: [] },
  { periodo: 6, codigo: "02/7", nome: "Sistemas de Controle I", ch: 50, pre: ["01/7", "02/3"], co: ["03/7"] },
  { periodo: 6, codigo: "03/7", nome: "Laboratório de Sistemas de Controle I", ch: 25, pre: ["08/3"], co: ["02/7"] },
  // 7º
  { periodo: 7, codigo: "08/9", nome: "Dinâmica de Robôs", ch: 50, pre: ["06/9"], co: [] },
  { periodo: 7, codigo: "05/10", nome: "Usinagem dos Materiais I", ch: 25, pre: ["01/8", "02/8", "03/8"], co: ["06/10"] },
  { periodo: 7, codigo: "06/10", nome: "Laboratório de Usinagem dos Materiais I", ch: 25, pre: ["01/8", "02/8", "03/8"], co: ["05/10"] },
  { periodo: 7, codigo: "05/6", nome: "Máquinas Elétricas I", ch: 25, pre: ["01/6"], co: ["06/6"] },
  { periodo: 7, codigo: "06/6", nome: "Laboratório de Máquinas Elétricas I", ch: 25, pre: ["02/6"], co: ["05/6"] },
  { periodo: 7, codigo: "03/11", nome: "Laboratório de Fenômenos de Transporte", ch: 25, pre: ["01/11", "02/11"], co: [] },
  { periodo: 7, codigo: "04/7", nome: "Sistemas de Controle II", ch: 50, pre: ["02/7"], co: ["05/7"] },
  { periodo: 7, codigo: "05/7", nome: "Laboratório de Sistemas de Controle II", ch: 25, pre: ["03/7"], co: ["04/7"] },
  // 8º
  { periodo: 8, codigo: "06/7", nome: "Robótica Industrial", ch: 25, pre: ["08/9"], co: ["07/7"] },
  { periodo: 8, codigo: "07/7", nome: "Laboratório de Robótica Industrial", ch: 25, pre: ["08/9"], co: ["06/7"] },
  { periodo: 8, codigo: "04/12", nome: "Metodologia de Pesquisa", ch: 25, pre: [], co: [] },
  { periodo: 8, codigo: "07/6", nome: "Máquinas Elétricas II", ch: 25, pre: ["05/6"], co: ["08/6"] },
  { periodo: 8, codigo: "08/6", nome: "Laboratório de Máquinas Elétricas II", ch: 25, pre: ["06/6"], co: ["07/6"] },
  { periodo: 8, codigo: "09/6", nome: "Eletrônica de Potência", ch: 50, pre: ["03/6"], co: ["10/6"] },
  { periodo: 8, codigo: "10/6", nome: "Laboratório de Eletrônica de Potência", ch: 25, pre: ["04/6"], co: ["09/6"] },
  // 9º
  { periodo: 9, codigo: "06/8", nome: "Automação de Sistemas", ch: 25, pre: ["04/8"], co: ["07/8"] },
  { periodo: 9, codigo: "07/8", nome: "Laboratório de Automação de Sistemas", ch: 25, pre: ["05/8"], co: ["06/8"] },
  { periodo: 9, codigo: "04/11", nome: "Operações Unitárias: Equipamentos Industriais e de Processo", ch: 25, pre: ["07/9"], co: [] },
  { periodo: 9, codigo: "08/8", nome: "Instrumentação Industrial", ch: 25, pre: ["03/6"], co: ["09/8"] },
  { periodo: 9, codigo: "09/8", nome: "Laboratório de Instrumentação Industrial", ch: 25, pre: [], co: ["08/8"] },
  // 10º
  { periodo: 10, codigo: "07/12", nome: "Manutenção e Segurança", ch: 25, pre: ["07/9"], co: [] },
  { periodo: 10, codigo: "04/1", nome: "Gestão Ambiental", ch: 25, pre: [], co: [] },
  { periodo: 10, codigo: "06/1", nome: "Engenharia Econômica e Financeira para Projeto de Investimentos", ch: 25, pre: [], co: [] },
  { periodo: 10, codigo: "05/1", nome: "Psicologia Aplicada às Organizações", ch: 25, pre: [], co: [] },
];

/** Obrigatórias Design de Moda — Quadros 78–87 (PPC 2024 CGRAD). */
const MODA_ROWS = [
  // 1º
  { periodo: 1, codigo: "01/1", nome: "História da Arte e do Design", ch: 50, pre: [], co: [] },
  { periodo: 1, codigo: "02/1", nome: "Desenho de Expressão e da Figura de Moda", ch: 50, pre: [], co: [] },
  { periodo: 1, codigo: "03/1", nome: "Introdução à Produção Industrial", ch: 50, pre: [], co: [] },
  { periodo: 1, codigo: "04/1", nome: "Teoria e Fundamentos do Design", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "05/1", nome: "Introdução à Sociologia", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "06/1", nome: "Tecnologia de Materiais Têxteis", ch: 25, pre: [], co: [] },
  { periodo: 1, codigo: "07/1", nome: "Ergonomia Aplicada à Moda", ch: 25, pre: [], co: [] },
  // 2º
  { periodo: 2, codigo: "01/2", nome: "Modelagem Industrial I", ch: 50, pre: [], co: [] },
  { periodo: 2, codigo: "02/2", nome: "Tecnologia de Beneficiamentos", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "03/2", nome: "História da Indumentária e da Moda", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "04/2", nome: "Desenho Técnico de Moda", ch: 50, pre: [], co: [] },
  { periodo: 2, codigo: "05/2", nome: "Laboratório de Criatividade", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "06/2", nome: "Computação Gráfica Aplicada à Moda", ch: 25, pre: [], co: [] },
  { periodo: 2, codigo: "07/2", nome: "Tecnologia da Produção I", ch: 50, pre: [], co: [] },
  // 3º
  { periodo: 3, codigo: "01/3", nome: "Modelagem Industrial II", ch: 50, pre: ["01/2"], co: [] },
  { periodo: 3, codigo: "02/3", nome: "Moda, Semiótica e Comunicação", ch: 50, pre: [], co: [] },
  { periodo: 3, codigo: "03/3", nome: "Desenho de Moda Digital", ch: 50, pre: [], co: [] },
  { periodo: 3, codigo: "04/3", nome: "Tecnologia da Produção II", ch: 50, pre: ["07/2"], co: [] },
  { periodo: 3, codigo: "05/3", nome: "Desenho e Ilustração de Moda", ch: 50, pre: ["02/1"], co: [] },
  // 4º
  { periodo: 4, codigo: "01/4", nome: "Metodologia Científica", ch: 25, pre: [], co: [] },
  { periodo: 4, codigo: "02/4", nome: "Projeto de Desenvolvimento de Coleção Conceitual", ch: 50, pre: ["02/3"], co: [] },
  { periodo: 4, codigo: "03/4", nome: "Trend Hunting", ch: 25, pre: [], co: [] },
  { periodo: 4, codigo: "04/4", nome: "Gestão Organizacional", ch: 25, pre: [], co: [] },
  { periodo: 4, codigo: "05/4", nome: "Prática de Prototipagem I", ch: 50, pre: ["01/3", "04/3"], co: [] },
  { periodo: 4, codigo: "06/4", nome: "Modelagem e Confecção Masculina", ch: 50, pre: [], co: [] },
  { periodo: 4, codigo: "07/4", nome: "Psicologia Aplicada às Organizações", ch: 25, pre: [], co: [] },
  // 5º
  { periodo: 5, codigo: "01/5", nome: "Produção de Moda", ch: 25, pre: [], co: [] },
  { periodo: 5, codigo: "02/5", nome: "Marketing e Comunicação de Moda", ch: 25, pre: [], co: [] },
  { periodo: 5, codigo: "03/5", nome: "Planejamento e Desenvolvimento de Coleção Comercial", ch: 50, pre: ["02/4"], co: [] },
  { periodo: 5, codigo: "04/5", nome: "Moulage", ch: 50, pre: ["01/2"], co: [] },
  { periodo: 5, codigo: "06/5", nome: "Fotografia e Imagem de Moda", ch: 50, pre: [], co: [] },
  { periodo: 5, codigo: "05/5", nome: "Gestão Financeira", ch: 25, pre: [], co: [] },
  // 6º
  { periodo: 6, codigo: "01/6", nome: "Metodologia de Pesquisa", ch: 25, pre: ["01/4", "03/5"], co: [] },
  { periodo: 6, codigo: "02/6", nome: "Projeto de Design Sustentável", ch: 50, pre: [], co: [] },
  { periodo: 6, codigo: "03/6", nome: "Modelagem Criativa", ch: 50, pre: ["04/5"], co: [] },
  { periodo: 6, codigo: "04/6", nome: "CAD Aplicado à Modelagem", ch: 50, pre: [], co: [] },
  { periodo: 6, codigo: "05/6", nome: "Filosofia da Tecnologia", ch: 25, pre: [], co: [] },
  // 7º
  { periodo: 7, codigo: "01/7", nome: "Pesquisa de Mercado e Branding", ch: 25, pre: ["02/5"], co: [] },
  { periodo: 7, codigo: "02/7", nome: "Vitrinismo e Visual Merchandising", ch: 25, pre: [], co: [] },
  { periodo: 7, codigo: "03/7", nome: "Projeto Integrador de Moda I", ch: 25, pre: ["03/5", "01/6"], co: [] },
  { periodo: 7, codigo: "04/7", nome: "Educação Empreendedora e Inovação", ch: 25, pre: [], co: [] },
  { periodo: 7, codigo: "05/7", nome: "Contexto Social e Profissional da Área de Design de Moda", ch: 25, pre: [], co: [] },
  { periodo: 7, codigo: "06/7", nome: "Gestão da Produção e Custos", ch: 25, pre: [], co: [] },
  // 8º
  { periodo: 8, codigo: "01/8", nome: "Portfólio de Moda", ch: 25, pre: ["03/7"], co: [] },
  { periodo: 8, codigo: "02/8", nome: "Produção Editorial e Desfile de Moda", ch: 50, pre: ["03/7"], co: [] },
  { periodo: 8, codigo: "04/8", nome: "Projeto Integrador de Moda II", ch: 25, pre: ["02/7", "03/7"], co: ["03/8"] },
  { periodo: 8, codigo: "03/8", nome: "Prototipagem do Projeto Integrador de Moda", ch: 50, pre: ["03/7"], co: ["04/8"] },
];

function validateRows(rows, label) {
  const codes = new Set(rows.map((r) => r.codigo));
  const orphans = [];
  for (const r of rows) {
    for (const id of [...r.pre, ...r.co]) {
      if (!codes.has(id)) orphans.push(`${r.codigo} → ${id}`);
    }
  }
  const byPeriod = {};
  for (const r of rows) {
    byPeriod[r.periodo] = (byPeriod[r.periodo] ?? 0) + 1;
  }
  console.log(`[${label}] ${rows.length} disciplinas`, byPeriod);
  if (orphans.length) {
    console.warn(`[${label}] requisitos órfãos:`, orphans);
  }
}

function main() {
  for (const r of MECA_ROWS) r.codigo = normalizeCode(r.codigo);
  for (const r of MODA_ROWS) r.codigo = normalizeCode(r.codigo);

  validateRows(MECA_ROWS, "eng-mecatronica");
  validateRows(MODA_ROWS, "design-moda");

  const mecaTsv = writeTsv(
    "ppc_data_eng-mecatronica.txt",
    MECA_ROWS,
    "# PPC Eng. Mecatrônica (CEFET-MG Divinópolis) — Quadro 14 obrigatórias\n# Fonte: docs/referencias/PPC-mecatrônica-revisado.pdf\n# Regenerar: node scripts/build-multi-ppc-seeds.mjs"
  );
  const modaTsv = writeTsv(
    "ppc_data_design-moda.txt",
    MODA_ROWS,
    "# PPC Design de Moda (CEFET-MG Divinópolis) — Quadros 78–87 obrigatórias\n# Fonte: docs/referencias/PPC-Design-de-Moda-Alteração-2024-v09-Versão-CGRAD.pdf\n# Regenerar: node scripts/build-multi-ppc-seeds.mjs"
  );

  const mecaJson = parseTsvToJson(mecaTsv, "disciplinas_db_eng-mecatronica.json");
  const modaJson = parseTsvToJson(modaTsv, "disciplinas_db_design-moda.json");

  console.log("TSV:", mecaTsv);
  console.log("TSV:", modaTsv);
  console.log(`JSON: ${mecaJson.outPath} (${mecaJson.count})`);
  console.log(`JSON: ${modaJson.outPath} (${modaJson.count})`);
}

main();
