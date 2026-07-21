import "module";
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};
import fs from 'fs';
import { parsePortalPageData } from '../src/lib/scraper/portal-discente/parse-portal-page';
import { extractPortalRawFromHtml } from '../src/lib/scraper/portal-discente/extract-portal-raw';
import { persistPortalSnapshot } from '../src/lib/sync/persist-portal-snapshot';
import { runWithUserDb } from '../src/lib/db/connection-manager';

async function test() {
  const files = fs.readdirSync('.data/users/16532523674/scrape-debug').filter(f => f.includes('portal-discente-pagina.html')).sort();
  const html = fs.readFileSync('.data/users/16532523674/scrape-debug/' + files[files.length - 1], 'utf8');
  const raw = extractPortalRawFromHtml(html);
  raw.html = html;
  const snapshot = parsePortalPageData(raw, 'eng-mecatronica');
  console.log('SemestreAtual:', snapshot.semestreAtual);
  await runWithUserDb('16532523674', async () => {
    try {
      const res = await persistPortalSnapshot(snapshot);
      console.log('Persist result:', res);
    } catch (e: any) {
      console.error('ERROR PERSISTING:', e.message);
    }
  });
}
test();
