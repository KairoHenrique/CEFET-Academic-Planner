import "module";
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};
import { runWithUserDb } from '../src/lib/db/connection-manager';
import { persistPortalSnapshot } from '../src/lib/sync/persist-portal-snapshot';
import fs from 'fs';
import { parsePortalPageData } from '../src/lib/scraper/portal-discente/parse-portal-page';
import { extractPortalRawFromHtml } from '../src/lib/scraper/portal-discente/extract-portal-raw';

const html = fs.readFileSync('.data/users/16532523674/scrape-debug/1784488359230-portal-discente-pagina.html', 'utf8');
const raw = extractPortalRawFromHtml(html);
raw.html = html;
const snap = parsePortalPageData(raw, 'eng-mecatronica');

console.log("Semestre atual length:", snap.semestreAtual.length);

runWithUserDb('16532523674', () => {
  persistPortalSnapshot(snap, '16532523674', 'eng-mecatronica');
  console.log('Done!');
});
