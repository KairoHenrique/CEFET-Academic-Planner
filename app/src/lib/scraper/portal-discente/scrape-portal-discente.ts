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
import { withAuthenticatedPage } from "@/lib/scraper/session-context";
import type { SigaaSession } from "@/lib/scraper/types";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

async function scrapeLivePortal(session: SigaaSession): Promise<PortalDiscenteSnapshot> {
  return withAuthenticatedPage(session, async (page) => {
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
    const snapshot = parsePortalPageData(raw);

    try {
      assertPortalSnapshot(snapshot);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Dados incompletos no portal.";
      throw ScraperError.scrapeFailed(message);
    }

    return snapshot;
  });
}

export async function scrapePortalDiscente(
  session: SigaaSession
): Promise<PortalDiscenteSnapshot> {
  if (SIGAA_SCRAPER_MOCK) {
    if (session.username.toLowerCase() === "offline") {
      throw ScraperError.offline();
    }
    return buildMockPortalSnapshot(session.username);
  }

  try {
    return await scrapeLivePortal(session);
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }
    throw mapUnknownScraperError(error);
  }
}
