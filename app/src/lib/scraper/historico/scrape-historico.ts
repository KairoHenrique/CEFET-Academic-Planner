import type { Page } from "playwright";
import { SIGAA_PORTAL_DISCENTE_URL } from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import { buildMockHistoricoSnapshot } from "@/lib/scraper/historico/mock-historico-snapshot";
import { dismissSigaaBlockingOverlays, dismissSigaaCookieBanner } from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { countPersistableHistoricoDisciplinas } from "@/lib/sync/historico-snapshot-policy";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";
import { scrapeIndicesAcademicos } from "@/lib/scraper/historico/scrape-indices-academicos";

/**
 * Navega até o portal discente e entra em Ensino -> Consultar Índices Acadêmicos
 * para extrair o histórico de notas e a integralização.
 */
export async function scrapeHistorico(
  page: Page,
  options?: { skipPortalGoto?: boolean }
): Promise<HistoricoSnapshot> {
  try {
    if (!options?.skipPortalGoto && !page.url().includes("discente")) {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
    }

    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);

    const snapshot = await scrapeIndicesAcademicos(page);
    const persistable = countPersistableHistoricoDisciplinas(snapshot);
    
    console.info(
      `[scraper:historico] HTML SIGAA: ${snapshot.disciplinas.length} parseada(s), ${persistable} com situação final.`
    );

    if (persistable === 0) {
      console.warn("[scraper:historico] Parser retornou 0 disciplinas persistíveis.");
    }

    return snapshot;
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message = error instanceof Error ? error.message : "Falha ao raspar histórico.";
    console.warn(`[scraper:historico] ${message}`);
    return buildEmptySnapshot("erro");
  }
}

function buildEmptySnapshot(reason: string): HistoricoSnapshot {
  console.warn(`[scraper:historico] Snapshot vazio (${reason}).`);
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: [],
    chResumo: [],
  };
}

export function scrapeHistoricoMock(): HistoricoSnapshot {
  return buildMockHistoricoSnapshot();
}

