import { ensureDbReady } from "../src/lib/db/bootstrap";
import db from "../src/lib/db/index";

ensureDbReady();

const tables = [
  "aluno",
  "historico",
  "semestre_atual",
  "notas",
  "faltas",
  "tarefas",
  "grupo_membros",
  "integralizacao",
  "calendario_academico",
  "turmas_ofertadas",
  "eventos_calendario",
  "configuracoes",
] as const;

console.log("=== Contagens ===");
for (const table of tables) {
  const row = db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as { n: number };
  console.log(`${table}: ${row.n}`);
}

console.log("\n=== aluno ===");
console.log(db.prepare("SELECT * FROM aluno").all());

console.log("\n=== configuracoes (sync/sigaa) ===");
console.log(
  db
    .prepare(
      `SELECT chave, valor FROM configuracoes WHERE chave LIKE 'sync.%' OR chave LIKE 'sigaa.%'`
    )
    .all()
);

console.log("\n=== grupo_membros (matrículas distintas) ===");
console.log(
  db
    .prepare(
      `SELECT DISTINCT matricula FROM grupo_membros WHERE matricula IS NOT NULL AND TRIM(matricula) != ''`
    )
    .all()
);
