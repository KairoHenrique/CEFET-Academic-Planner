import fs from "fs";
import path from "path";
import { parseHistoricoPdfText } from "../src/lib/scraper/historico/parse-historico-pdf";

async function run() {
  const buf = fs.readFileSync(path.join(__dirname, "../test/data/05-versions-space.pdf"));
  const { extractHistoricoPdfText } = await import("../src/lib/scraper/historico/extract-historico-pdf-text");
  
  const text = await extractHistoricoPdfText(buf);
  const snap = parseHistoricoPdfText(text);
  
  // NOTE: This will still use the old parseDisciplinas. I need to write a script that tests the block parser directly!
}
