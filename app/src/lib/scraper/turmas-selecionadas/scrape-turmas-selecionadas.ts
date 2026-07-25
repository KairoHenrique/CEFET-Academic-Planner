import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { navigateViaMatriculaMenu } from "@/lib/scraper/turmas-ofertadas/navigate-via-matricula";
import { parseTurmasSelecionadasTableHtml, type TurmaSelecionadaItem } from "@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas";

export async function scrapeTurmasSelecionadas(
  page: Page,
  password?: string
): Promise<TurmaSelecionadaItem[]> {
  try {
    const navigated = await navigateViaMatriculaMenu(page, {
      password,
      finalAction: "turmas_selecionadas",
    });

    if (!navigated) {
      console.warn("[scraper:turmas-selecionadas] Não foi possível navegar para as turmas selecionadas.");
      return [];
    }

    const html = await page.content();
    require("fs").writeFileSync(".data/scrape-debug/" + Date.now() + "-turmas-selecionadas-lista.html", html);

    const turmas = parseTurmasSelecionadasTableHtml(html);
    return turmas;
  } catch (error) {
    console.warn("[scraper:turmas-selecionadas] Erro:", error);
    return [];
  }
}
