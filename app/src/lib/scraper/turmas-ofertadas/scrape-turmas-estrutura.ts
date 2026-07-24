import type { Page } from "playwright";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { SIGAA_SCRAPER_DEBUG } from "@/lib/scraper/constants";
import { navigateViaMatriculaMenu } from "@/lib/scraper/turmas-ofertadas/navigate-via-matricula";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { parseTurmasEstruturaHtml } from "@/lib/scraper/turmas-ofertadas/parse-turmas-estrutura-html";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import type { TurmasOfertadasSnapshot } from "@/lib/scraper/types/turmas-ofertadas";

export interface ScrapeTurmasEstruturaOptions {
  referenceDate?: Date;
  password?: string;
}

function buildUnavailableSnapshot(
  semestreAlvo: string,
  reason: string,
  referenceDate = new Date()
): TurmasOfertadasSnapshot {
  console.warn(`[scraper:estrutura] Indisponível: ${reason}`);
  return {
    scrapedAt: referenceDate.toISOString(),
    semestreAlvo,
    turmas: [],
    unavailable: true,
    unavailableReason: reason,
  };
}

export async function scrapeTurmasEstrutura(
  page: Page,
  options?: ScrapeTurmasEstruturaOptions
): Promise<TurmasOfertadasSnapshot> {
  const referenceDate = options?.referenceDate ?? new Date();
  const semestreAlvo = resolveNextAcademicSemesterLabel(referenceDate);

  try {
    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);

    const navigated = await navigateViaMatriculaMenu(page, {
      password: options?.password,
      finalAction: "turmas_estrutura",
    });

    if (!navigated) {
      if (SIGAA_SCRAPER_DEBUG) {
        dumpScrapeHtml(
          "turmas-estrutura",
          "falha-navegacao",
          await page.content().catch(() => null)
        );
      }
      return buildUnavailableSnapshot(
        semestreAlvo,
        "Menu Turmas da Estrutura Curricular indisponível no SIGAA. O período de matrículas pode estar fechado.",
        referenceDate
      );
    }

    if (SIGAA_SCRAPER_DEBUG) {
      dumpScrapeHtml(
        "turmas-estrutura",
        "lista",
        await page.content().catch(() => null)
      );
    }

    const html = await page.content();
    const snapshot = parseTurmasEstruturaHtml(html, { referenceDate });

    console.info(
      `[scraper:estrutura] Encontradas ${snapshot.turmas.length} turmas disponíveis.`
    );
    return snapshot;
  } catch (error) {
    console.error("[scraper:estrutura] Erro fatal:", error);
    if (SIGAA_SCRAPER_DEBUG) {
      dumpScrapeHtml(
        "turmas-estrutura",
        "fatal-error",
        await page.content().catch(() => null)
      );
    }
    return buildUnavailableSnapshot(
      semestreAlvo,
      "Erro inesperado durante a extração das Turmas da Estrutura.",
      referenceDate
    );
  }
}
