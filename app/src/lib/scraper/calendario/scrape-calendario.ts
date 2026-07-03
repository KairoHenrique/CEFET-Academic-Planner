import fs from "node:fs";
import type { Page } from "playwright";
import {
  resolveCalendarioSemesterTargets,
  isCalendarioPublicationLikely,
} from "@/lib/academic/resolve-academic-semester";
import {
  SIGAA_CALENDARIO_HTML_PATH,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_DEBUG,
} from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import {
  navigateToCalendarioAcademico,
  returnToCalendarioList,
} from "@/lib/scraper/calendario/navigate-to-calendario";
import {
  isCalendarioDetailPage,
  isCalendarioListPage,
  openCalendarioDetailForSemester,
} from "@/lib/scraper/calendario/open-calendario-detail";
import { isPortalDiscenteHomeHtml } from "@/lib/scraper/calendario/calendario-event-filter";
import { parseCalendarioHtml } from "@/lib/scraper/calendario/parse-calendario-html";
import { buildMockCalendarioSnapshot } from "@/lib/scraper/calendario/mock-calendario-snapshot";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import type { CalendarioAcademicoSnapshot } from "@/lib/scraper/types/calendario";

export interface ScrapeCalendarioOptions {
  skipPortalGoto?: boolean;
  referenceDate?: Date;
}

function buildUnavailableSnapshot(
  semestreAlvo: string[],
  reason: string
): CalendarioAcademicoSnapshot {
  console.warn(`[scraper:calendario] Indisponível: ${reason}`);
  return {
    scrapedAt: new Date().toISOString(),
    semestreAlvo,
    eventos: [],
    unavailable: true,
    unavailableReason: reason,
  };
}

async function dumpCalendarioDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("calendario", section, await page.content().catch(() => null));
}

async function scrapeCalendarioBySemester(
  page: Page,
  likelySemesters: string[]
): Promise<CalendarioAcademicoSnapshot["eventos"]> {
  const merged: CalendarioAcademicoSnapshot["eventos"] = [];

  for (const semestre of likelySemesters) {
    if (await isCalendarioDetailPage(page)) {
      await returnToCalendarioList(page);
    }

    if (!(await isCalendarioListPage(page))) {
      const reopened = await navigateToCalendarioAcademico(page, {
        skipReturnToPortal: true,
        semestresAlvo: likelySemesters,
      });
      if (!reopened) continue;
    }

    const opened = await openCalendarioDetailForSemester(page, [semestre]);
    if (!opened) {
      console.warn(`[scraper:calendario] Detalhe indisponível para ${semestre}.`);
      continue;
    }

    await dumpCalendarioDebugHtml(page, `pagina-${semestre.replace(".", "-")}`);
    const html = await page.content();
    if (isPortalDiscenteHomeHtml(html)) continue;

    const partial = parseCalendarioHtml(html, {
      semestreAlvo: [semestre],
      semestreContext: semestre,
    });

    merged.push(...partial.eventos);
    console.info(
      `[scraper:calendario] ${partial.eventos.length} evento(s) em ${semestre}.`
    );

    await returnToCalendarioList(page);
  }

  return merged;
}

/**
 * Robô isolado B66 — Ensino → Calendário Acadêmico.
 * Retorna snapshot vazio (unavailable) quando o menu/página não existir no SIGAA.
 */
export async function scrapeCalendarioAcademico(
  page: Page,
  options?: ScrapeCalendarioOptions
): Promise<CalendarioAcademicoSnapshot> {
  const referenceDate = options?.referenceDate ?? new Date();
  const semestreAlvo = resolveCalendarioSemesterTargets(referenceDate);

  const likelySemesters = semestreAlvo.filter((semestre) =>
    isCalendarioPublicationLikely(semestre, referenceDate)
  );

  if (likelySemesters.length === 0) {
    return buildUnavailableSnapshot(
      semestreAlvo,
      "Fora da janela típica de publicação do calendário acadêmico."
    );
  }

  if (SIGAA_CALENDARIO_HTML_PATH) {
    try {
      const html = fs.readFileSync(SIGAA_CALENDARIO_HTML_PATH, "utf8");
      const snapshot = parseCalendarioHtml(html, { semestreAlvo: likelySemesters });
      console.info(
        `[scraper:calendario] HTML local: ${snapshot.eventos.length} evento(s).`
      );
      return snapshot;
    } catch (error) {
      console.warn(
        `[scraper:calendario] Falha ao ler HTML local (${SIGAA_CALENDARIO_HTML_PATH}):`,
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

    const navigated = await navigateToCalendarioAcademico(page, {
      skipReturnToPortal: options?.skipPortalGoto,
      semestresAlvo: likelySemesters,
    });

    if (!navigated || !(await isCalendarioListPage(page))) {
      await dumpCalendarioDebugHtml(page, "falha-navegacao-lista");
      return buildUnavailableSnapshot(
        semestreAlvo,
        "Menu Calendário Acadêmico indisponível no SIGAA."
      );
    }

    await dumpCalendarioDebugHtml(page, "lista-calendarios");

    const eventos = await scrapeCalendarioBySemester(page, likelySemesters);

    if (eventos.length === 0) {
      await dumpCalendarioDebugHtml(page, "sem-eventos");
      return buildUnavailableSnapshot(
        semestreAlvo,
        "Calendário publicado sem eventos parseáveis."
      );
    }

    console.info(
      `[scraper:calendario] ${eventos.length} evento(s) para ${likelySemesters.join(", ")}.`
    );

    return {
      scrapedAt: new Date().toISOString(),
      semestreAlvo,
      eventos,
    };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message =
      error instanceof Error ? error.message : "Falha ao raspar calendário.";
    console.warn(`[scraper:calendario] ${message}`);
    await dumpCalendarioDebugHtml(page, "erro");
    return buildUnavailableSnapshot(semestreAlvo, message);
  }
}

export function scrapeCalendarioAcademicoMock(
  referenceDate = new Date()
): CalendarioAcademicoSnapshot {
  return buildMockCalendarioSnapshot(referenceDate);
}
