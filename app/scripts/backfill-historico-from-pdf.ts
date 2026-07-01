/**
 * Importa histórico escolar de um PDF local para o SQLite do usuário.
 *
 * Uso (pasta app/):
 *   npx tsx scripts/backfill-historico-from-pdf.ts CPF caminho/para/historico.pdf
 *
 * Ou com variável de ambiente:
 *   $env:SIGAA_HISTORICO_PDF_PATH="..\docs\referencias\historico_00000000000.pdf"
 *   npx tsx scripts/backfill-historico-from-pdf.ts 00000000000
 */
import fs from "node:fs";
import path from "node:path";
import { ensureDbReady } from "../src/lib/db/bootstrap";
import { runWithUserDb } from "../src/lib/db/connection-manager";
import { buildMapa } from "../src/lib/mapa/build-mapa";
import { parseHistoricoPdfBuffer } from "../src/lib/scraper/historico/parse-historico-pdf";
import { persistHistoricoSnapshot } from "../src/lib/sync/persist-historico-snapshot";
import { recordHistoricoSyncedAt } from "../src/lib/sync/sync-preferences";

async function main(): Promise<void> {
  const username = process.argv[2];
  const pdfArg = process.argv[3];
  const pdfPath =
    pdfArg ??
    process.env.SIGAA_HISTORICO_PDF_PATH ??
    "../docs/referencias/historico_00000000000.pdf";

  if (!username?.trim()) {
    console.error("Informe o CPF/login: npx tsx scripts/backfill-historico-from-pdf.ts CPF [pdf]");
    process.exit(1);
  }

  const resolvedPdf = path.resolve(pdfPath);
  if (!fs.existsSync(resolvedPdf)) {
    console.error(`PDF não encontrado: ${resolvedPdf}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolvedPdf);
  const snapshot = await parseHistoricoPdfBuffer(buffer);

  runWithUserDb(username, () => {
    ensureDbReady();
    const result = persistHistoricoSnapshot(snapshot);
    if (result.persisted) {
      recordHistoricoSyncedAt();
    }

    console.log("Persist:", result);
    const mapa = buildMapa();
    console.log("Mapa stats:", mapa.stats);
    console.log("historicoSynced:", mapa.historicoSynced);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
