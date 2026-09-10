import { SIGAA_PORTAL_DISCENTE_URL } from "@/lib/scraper/sigaa-urls";
import { ScraperError } from "@/lib/scraper/errors";
import { extractPortalRawFromHtml } from "@/lib/scraper/portal-discente/extract-portal-raw-html";
import {
  assertPortalSnapshot,
  parsePortalPageData,
} from "@/lib/scraper/portal-discente/parse-portal-page";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";
import type { DeviceHttpSession } from "@/lib/device-sync/http-session";

export async function scrapePortalDiscenteHttp(
  session: DeviceHttpSession,
  cursoId?: string
): Promise<PortalDiscenteSnapshot> {
  const page = await session.request(SIGAA_PORTAL_DISCENTE_URL, {
    method: "GET",
  });

  if (!page.response.ok) {
    throw ScraperError.scrapeFailed(
      `Falha ao abrir o portal do discente (${page.response.status}).`
    );
  }

  if (/verTelaLogin\.do/i.test(page.response.url) || /name=["']password["']/i.test(page.text)) {
    throw ScraperError.invalidCredentials(
      "Sessão SIGAA expirada no sync pelo aparelho."
    );
  }

  const raw = extractPortalRawFromHtml(page.text);
  raw.html = page.text;

  const snapshot = parsePortalPageData(raw, cursoId);
  assertPortalSnapshot(snapshot);
  return snapshot;
}
