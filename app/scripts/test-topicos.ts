import { resolveDisciplinaCodigoByNome } from "../src/lib/scraper/portal-discente/resolve-disciplina-codigo";
import Database from "better-sqlite3";

const db = new Database(".data/users/16532523674/planner.db");
const disciplinas = db.prepare("SELECT * FROM disciplinas").all() as any[];

const t1 = "TÓPICOS ESPECIAIS EM CIRCUITOS ELÉTRICOS E ELETRÔNICOS: TELECOMUNICAÇÕES APLICADAS À MECATRÔNICA";
console.log("Resolving:", t1);
console.log("Result:", resolveDisciplinaCodigoByNome(t1, disciplinas));
