import fs from "fs";
import path from "path";
import { parseHistoricoPdfBuffer, parseHistoricoPdfText } from "../src/lib/scraper/historico/parse-historico-pdf";

async function run() {
  const buf = fs.readFileSync(path.join(__dirname, "../test/data/05-versions-space.pdf"));
  const { extractHistoricoPdfText } = await import("../src/lib/scraper/historico/extract-historico-pdf-text");
  
  const text = await extractHistoricoPdfText(buf);
  console.log("=== PDF TEXT (Primeiros 1000 chars) ===");
  console.log(text.substring(0, 1000));
  
  const snap = parseHistoricoPdfText(text);
  console.log("\n=== PARSED DISCIPLINES ===");
  console.log(snap.disciplinas.map(d => `${d.codigo} - ${d.nome} (${d.situacao})`).join("\n"));
}

run();
