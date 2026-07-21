import fs from "fs";
import { parseHistoricoPdfBuffer } from "../src/lib/scraper/historico/parse-historico-pdf";

async function run() {
  const buf = fs.readFileSync(".data/users/16532523674/scrape-debug/1784483524477-historico-escolar.pdf");
  const snap = await parseHistoricoPdfBuffer(buf);
  console.log(snap.chResumo);
}

run();
