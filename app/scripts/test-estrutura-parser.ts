import fs from "node:fs";
import { parseTurmasEstruturaHtml } from "../src/lib/scraper/turmas-ofertadas/parse-turmas-estrutura-html";

const html = fs.readFileSync("estrutura-base.html", "utf-8");
const snapshot = parseTurmasEstruturaHtml(html);
console.log(`Turmas parseadas: ${snapshot.turmas.length}`);
console.log(JSON.stringify(snapshot.turmas.slice(0, 5), null, 2));
