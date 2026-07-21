import fs from "fs";
import { parsePortalHtmlForClient } from "../src/lib/scraper/portal-discente/parse-portal-page-client";

const html = fs.readFileSync(".data/users/16532523674/scrape-debug/1784488359230-portal-discente-pagina.html", "utf8");
console.log(parsePortalHtmlForClient(html).disciplinasSemestre);
