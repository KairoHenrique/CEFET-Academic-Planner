import { chromium } from "playwright";
import { resolveUserDataDir, getActiveSigaaUsername } from "../app/src/lib/db/connection-manager";

async function main() {
  const browser = await chromium.launchPersistentContext(
    resolveUserDataDir(getActiveSigaaUsername()),
    { headless: false }
  );

  const page = await browser.newPage();
  await page.goto("https://sig.cefetmg.br/sigaa/portais/discente/discente.jsf");

  const html = await page.evaluate(() => {
    return document.querySelector("form[name='menu:form_menu_discente']")?.outerHTML;
  });

  console.log("MENU HTML FOUND:");
  console.log(html?.substring(0, 500) + "...");
  
  if (html) {
    const fs = require("fs");
    fs.writeFileSync("menu-dump.html", html);
    console.log("Menu dumped to menu-dump.html");
  }

  await browser.close();
}

main().catch(console.error);
