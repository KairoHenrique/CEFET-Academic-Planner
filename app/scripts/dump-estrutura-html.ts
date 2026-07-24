import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "node:fs";
import { launchSigaaBrowser, createSigaaContext } from "../src/lib/scraper/browser";
import { loginSigaaOnPage } from "../src/lib/scraper/auth";
import { navigateViaMatriculaMenu } from "../src/lib/scraper/turmas-ofertadas/navigate-via-matricula";
import { dismissSigaaCookieBanner, dismissSigaaBlockingOverlays } from "../src/lib/scraper/turma-virtual/portal-turma-navigation";

async function main() {
  const username = process.env.SIGAA_CPF;
  const password = process.env.SIGAA_PASSWORD;

  if (!username || !password) {
    console.error("Defina SIGAA_CPF e SIGAA_PASSWORD no seu .env.local ou no terminal.");
    process.exit(1);
  }

  const browser = await launchSigaaBrowser();
  const context = await createSigaaContext(browser);
  const page = await context.newPage();

  try {
    console.log("Fazendo login...");
    await loginSigaaOnPage(page, { username, password });
    const loggedIn = true;
    if (!loggedIn) {
      console.error("Falha no login.");
      return;
    }

    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);

    console.log("Navegando pelo menu de Matrícula -> Turmas da Estrutura...");
    const navigated = await navigateViaMatriculaMenu(page, { 
      password, 
      finalAction: "turmas_estrutura" 
    });

    if (!navigated) {
      console.error("Não foi possível chegar na tela de Turmas da Estrutura Curricular. O menu está disponível?");
      const html = await page.content();
      fs.writeFileSync("erro-estrutura.html", html);
      return;
    }

    console.log("Chegou na tela! Salvando HTML base...");
    const htmlBase = await page.content();
    fs.writeFileSync("estrutura-base.html", htmlBase);
    console.log("Salvo como estrutura-base.html");

    console.log("Tirando um screenshot da tela para podermos analisar os botões...");
    await page.screenshot({ path: "estrutura-base.png", fullPage: true });

    console.log("Sucesso! Mande o HTML e o Screenshot para o assistente analisar.");

  } catch (err) {
    console.error("Erro na automação:", err);
  } finally {
    await context.close();
    await browser.close();
  }
}

main();
