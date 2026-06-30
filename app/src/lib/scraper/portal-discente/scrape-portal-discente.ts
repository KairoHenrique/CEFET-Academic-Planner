import type { Page } from "playwright";
import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_MOCK,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { extractPortalRawFromPage } from "@/lib/scraper/portal-discente/extract-portal-raw";
import { buildMockPortalSnapshot } from "@/lib/scraper/portal-discente/mock-portal-snapshot";
import {
  assertPortalSnapshot,
  parsePortalPageData,
} from "@/lib/scraper/portal-discente/parse-portal-page";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { enrichPortalAtividadesComDetalhes } from "@/lib/scraper/portal-discente/scrape-portal-atividades";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

/**
 * Raspa o portal do discente usando uma page já logada no SIGAA.
 * Navega para a URL do portal, extrai dados brutos e parseia.
 */
export async function scrapePortalDiscente(
  page: Page
): Promise<PortalDiscenteSnapshot> {
  try {
    await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
      waitUntil: "domcontentloaded",
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    });
  } catch (error) {
    throw mapUnknownScraperError(error);
  }

  if (page.url().includes("verTelaLogin")) {
    throw ScraperError.authFailed("Sessão expirada ao acessar o portal do discente.");
  }

  const raw = await extractPortalRawFromPage(page);
  const pageHtml = await page.content();
  dumpScrapeHtml("portal-discente", "pagina", pageHtml);
  const snapshot = parsePortalPageData({ ...raw, html: pageHtml });

  if (snapshot.semestreAtual.length > 0) {
    console.info(
      `[scraper:portal] Semestre atual: ${snapshot.semestreAtual.length} disciplina(s) — ` +
        snapshot.semestreAtual.map((item) => item.codigo || item.nome).join(", ")
    );
  }

  if (snapshot.atividades.length > 0) {
    console.info(
      `[scraper:portal] Minhas atividades: ${snapshot.atividades.length} pendente(s)`
    );
    await enrichPortalAtividadesComDetalhes(page, snapshot.atividades);
  }

  try {
    assertPortalSnapshot(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Dados incompletos no portal.";
    console.warn(`[scraper:portal] assertPortalSnapshot warning: ${message}`);
    // Não throw — retorna snapshot parcial; pode ser férias ou semestre sem matrícula
  }

  return snapshot;
}

/**
 * Wrapper para mock mode — chamado pelo runSync quando SIGAA_SCRAPER_MOCK=true.
 */
export function scrapePortalDiscenteMock(username: string): PortalDiscenteSnapshot {
  if (username.toLowerCase() === "offline") {
    throw ScraperError.offline();
  }
  return buildMockPortalSnapshot(username);
}
