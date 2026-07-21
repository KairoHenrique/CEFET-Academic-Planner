import fs from "fs";
import { parseHistoricoPdfBuffer } from "../src/lib/scraper/historico/parse-historico-pdf";
import { persistHistoricoSnapshot } from "../src/lib/sync/persist-historico-snapshot";
import { runWithUserDb } from "../src/lib/db/connection-manager";

async function run() {
  const buf = fs.readFileSync(".data/users/16532523674/scrape-debug/1784483524477-historico-escolar.pdf");
  const snap = await parseHistoricoPdfBuffer(buf);

  runWithUserDb("16532523674", () => {
    persistHistoricoSnapshot(snap);
    console.log("Historico sync concluído.");
  });
}

run();
