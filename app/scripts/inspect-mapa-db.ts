import Database from "better-sqlite3";
import path from "path";
import { buildMapa } from "../src/lib/mapa/build-mapa";
import { runWithUserDb } from "../src/lib/db/connection-manager";
import { ensureDbReady } from "../src/lib/db/bootstrap";

const users = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["00000000000"];

for (const username of users) {
  const dbPath = path.join(".data", "users", username, "planner.db");
  const db = new Database(dbPath, { readonly: true });

  const aluno = db.prepare("SELECT matricula, nome FROM aluno LIMIT 1").get();
  const histCount = (
    db.prepare("SELECT COUNT(*) as c FROM historico").get() as { c: number }
  ).c;
  const configs = db
    .prepare("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'sync%'")
    .all();

  console.log("\n===", username, "===");
  console.log("aluno:", aluno);
  console.log("historico rows:", histCount);
  console.log("sync config:", configs);
  db.close();

  runWithUserDb(username, () => {
    ensureDbReady();
    const mapa = buildMapa();
    console.log("stats:", mapa.stats);
    for (const period of mapa.periods.slice(0, 5)) {
      console.log(
        `P${period.period}:`,
        period.subjects
          .map((s) => `${s.code}:${s.status}${s.blockedBy ? `(${s.blockedBy})` : ""}`)
          .join(", ")
      );
    }
  });
}
