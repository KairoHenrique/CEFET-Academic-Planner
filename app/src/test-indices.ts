import { chromium } from "playwright";
import { parseSigaaCredentials } from "@/lib/auth/sigaa-credentials-parser";
import { resolveUserDataDir } from "@/lib/db/connection-manager";
import { ScraperConnectionConfig } from "@/lib/scraper/types/scraper-config";
import { setupSigaaBrowserContext } from "@/lib/scraper/browser";
import { performSigaaLogin } from "@/lib/scraper/auth";
import { scrapeIndicesAcademicos } from "@/lib/scraper/historico/scrape-indices-academicos";

async function main() {
  const credentials = parseSigaaCredentials({
    username: process.env.SIGAA_CPF!,
    password: process.env.SIGAA_PASSWORD!,
  });

  const config: ScraperConnectionConfig = {
    userDataDir: resolveUserDataDir(credentials.username),
    mock: false,
    debug: true,
    headless: true,
  };

  const { browser, context } = await setupSigaaBrowserContext(config);

  try {
    const page = await context.newPage();
    
    console.log("Realizando login...");
    await performSigaaLogin(page, credentials);
    
    console.log("Navegando para Histórico e coletando dados...");
    const snapshot = await scrapeIndicesAcademicos(page);
    
    console.log("Snapshot retornado:");
    console.log(JSON.stringify(snapshot, null, 2));

  } catch (error) {
    console.error("Erro no scraper:", error);
  } finally {
    await browser.close();
  }
}

main();
