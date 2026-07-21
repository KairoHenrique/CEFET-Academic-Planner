import { runWithUserDb } from "../src/lib/db/connection-manager";
import { persistPortalSnapshot } from "../src/lib/sync/persist-portal-snapshot";
import { parsePortalHtmlForClient } from "../src/lib/scraper/portal-discente/parse-portal-page-client";
import fs from "fs";

const html = fs.readFileSync(".data/users/16532523674/scrape-debug/1784488359230-portal-discente-pagina.html", "utf8");
const snap = parsePortalHtmlForClient(html);

runWithUserDb("16532523674", () => {
  const res = persistPortalSnapshot(snap, "16532523674", "eng-mecatronica");
  console.log(res);
});
