import fs from "node:fs";
import type { Page } from "playwright";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_DEBUG,
  SIGAA_TURMAS_OFERTADAS_HTML_PATH,
} from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import { navigateToTurmasOfertadas } from "@/lib/scraper/turmas-ofertadas/navigate-to-turmas-ofertadas";
import { buildMockTurmasOfertadasSnapshot } from "@/lib/scraper/turmas-ofertadas/mock-turmas-ofertadas-snapshot";
import { parseTurmasOfertadasHtml } from "@/lib/scraper/turmas-ofertadas/parse-turmas-ofertadas-html";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import type { TurmasOfertadasSnapshot } from "@/lib/scraper/types/turmas-ofertadas";

export interface ScrapeTurmasOfertadasOptions {
  skipPortalGoto?: boolean;
  referenceDate?: Date;
}

function buildUnavailableSnapshot(
  semestreAlvo: string,
  reason: string,
  referenceDate = new Date()
): TurmasOfertadasSnapshot {
  console.warn(`[scraper:turmas] Indisponível: ${reason}`);
  return {
    scrapedAt: referenceDate.toISOString(),
    semestreAlvo,
    turmas: [],
    unavailable: true,
    unavailableReason: reason,
  };
}

async function dumpTurmasDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("turmas-ofertadas", section, await page.content().catch(() => null));
}

/**
 * Robô isolado B67 — Ensino → Consultar Turmas do Próx. Semestre.
 */
export async function scrapeTurmasOfertadas(
  page: Page,
  options?: ScrapeTurmasOfertadasOptions
): Promise<TurmasOfertadasSnapshot> {
  const referenceDate = options?.referenceDate ?? new Date();
  const semestreAlvo = resolveNextAcademicSemesterLabel(referenceDate);

  if (SIGAA_TURMAS_OFERTADAS_HTML_PATH) {
    try {
      const html = fs.readFileSync(SIGAA_TURMAS_OFERTADAS_HTML_PATH, "utf8");
      const snapshot = parseTurmasOfertadasHtml(html, {
        semestreAlvo,
        referenceDate,
      });
      console.info(
        `[scraper:turmas] HTML local: ${snapshot.turmas.length} turma(s).`
      );
      return snapshot;
    } catch (error) {
      console.warn(
        `[scraper:turmas] Falha ao ler HTML local (${SIGAA_TURMAS_OFERTADAS_HTML_PATH}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    if (!options?.skipPortalGoto && !page.url().includes("discente")) {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
    }

    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);

    const navigated = await navigateToTurmasOfertadas(page, {
      skipReturnToPortal: options?.skipPortalGoto,
    });

    if (!navigated) {
      await dumpTurmasDebugHtml(page, "falha-navegacao");
      return buildUnavailableSnapshot(
        semestreAlvo,
        "Menu Consultar Turmas do Próx. Semestre indisponível no SIGAA.",
        referenceDate
      );
    }

    await dumpTurmasDebugHtml(page, "lista-turmas");
    const html = await page.content();
    const snapshot = parseTurmasOfertadasHtml(html, {
      semestreAlvo,
      referenceDate,
    });

    if (snapshot.unavailable || snapshot.turmas.length === 0) {
      await dumpTurmasDebugHtml(page, "sem-turmas");
      return snapshot.unavailable
        ? snapshot
        : buildUnavailableSnapshot(
            semestreAlvo,
            "Turmas ofertadas publicadas sem linhas parseáveis.",
            referenceDate
          );
    }

    console.info(
      `[scraper:turmas] ${snapshot.turmas.length} turma(s) para ${snapshot.semestreAlvo}.`
    );
    return snapshot;
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message =
      error instanceof Error ? error.message : "Falha ao raspar turmas ofertadas.";
    console.warn(`[scraper:turmas] ${message}`);
    await dumpTurmasDebugHtml(page, "erro");
    return buildUnavailableSnapshot(semestreAlvo, message, referenceDate);
  }
}

export function scrapeTurmasOfertadasMock(
  referenceDate = new Date()
): TurmasOfertadasSnapshot {
  return buildMockTurmasOfertadasSnapshot(referenceDate);
}
