import fs from "fs";
import path from "path";
import { parseHistoricoPdfBuffer } from "../src/lib/scraper/historico/parse-historico-pdf";

async function run() {
  const buf = fs.readFileSync(path.join(__dirname, "../.data/users/00000000000/scrape-debug/1784579485803-historico-escolar.pdf"));
  const { extractHistoricoPdfText } = await import("../src/lib/scraper/historico/extract-historico-pdf-text");
  const snap = await parseHistoricoPdfBuffer(buf);
  const { resolveDisciplinaCodigoForHistorico } = await import("../src/lib/scraper/portal-discente/resolve-disciplina-codigo");
  
  const ipc = snap.disciplinas.find(d => d.codigo.includes("IPC"));
  if (ipc) {
    const ppcId = resolveDisciplinaCodigoForHistorico(ipc.nome, ipc.codigo, ipc.ch);
    console.log(`IPC '${ipc.codigo} - ${ipc.nome}' maps to Postgres ID: '${ppcId}'`);
  }
  
  const aed = snap.disciplinas.find(d => d.codigo.includes("AED"));
  if (aed) {
    const ppcId = resolveDisciplinaCodigoForHistorico(aed.nome, aed.codigo, aed.ch);
    console.log(`AED '${aed.codigo} - ${aed.nome}' maps to Postgres ID: '${ppcId}'`);
  }
}

run();
