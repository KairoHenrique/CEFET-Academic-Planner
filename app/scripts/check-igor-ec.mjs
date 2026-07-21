import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

async function run() {
  const ppcPath = path.resolve("./app/src/config/ppcs/eng-computacao.json");
  const ppc = JSON.parse(fs.readFileSync(ppcPath, "utf-8"));
  const map = new Map(ppc.disciplinas.map(d => [d.codigo, d.nome]));

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT disciplina_id, status, nota_final 
    FROM historico 
    WHERE user_id = '3f79d961-e9da-4033-826d-9cc4827148a0'
    ORDER BY disciplina_id
  `);

  console.log("=== IGOR'S DISCIPLINES IN ENGENHARIA DE COMPUTAÇÃO ===");
  for (const r of res.rows) {
    const nome = map.get(r.disciplina_id) || "Tópico/Optativa Desconhecida";
    console.log(`[${r.disciplina_id}] ${nome} - ${r.status.toUpperCase()} (${r.nota_final})`);
  }
  await client.end();
}
run();
