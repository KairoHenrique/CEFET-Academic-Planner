import { ensureDbReady } from "../src/lib/db/bootstrap";
import db from "../src/lib/db/index";

ensureDbReady();

const redesCo = db
  .prepare(
    "SELECT disciplina_id, requisito_id, tipo FROM requisitos WHERE disciplina_id = ? AND tipo = ?"
  )
  .all("07/4", "co");

console.log("Corequisitos de Redes (07/4):", redesCo);

const coCount = db
  .prepare("SELECT COUNT(*) as n FROM requisitos WHERE tipo = 'co'")
  .get() as { n: number };

console.log("Total corequisitos no banco:", coCount.n);
