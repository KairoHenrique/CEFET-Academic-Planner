import fs from "fs";
import path from "path";
import { extractHistoricoPdfText } from "../src/lib/scraper/historico/extract-historico-pdf-text";
import { parseHistoricoPdfBuffer } from "../src/lib/scraper/historico/parse-historico-pdf";

async function run() {
  const buf = fs.readFileSync(path.join(__dirname, "../../.data/users/00000000000/scrape-debug/1784579485803-historico-escolar.pdf"));
  const text = await extractHistoricoPdfText(buf);
  fs.writeFileSync("raw_text_dump.txt", text);
  console.log("Dumped raw text to raw_text_dump.txt");
  
  const snap = await parseHistoricoPdfBuffer(buf);
  console.log(JSON.stringify(snap.chResumo, null, 2));
}

run();
