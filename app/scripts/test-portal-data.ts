import fs from "fs";
import { load } from "cheerio";
import { parsePortalPageData } from "../src/lib/scraper/portal-discente/parse-portal-page";

const html = fs.readFileSync(".data/users/16532523674/scrape-debug/1784488359230-portal-discente-pagina.html", "utf8");
const $ = load(html);
const text = $.text();
const plainText = text.replace(/\s+/g, " ");

const data = parsePortalPageData({
  html,
  text,
  plainText,
  labelPairs: {},
  tableRows: [],
  chTableRows: []
});

console.log(data.disciplinasSemestre);
