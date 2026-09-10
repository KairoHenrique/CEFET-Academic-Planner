import {
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_TURMA_VIRTUAL_URL,
} from "./constants";
import type { DeviceHttpSession } from "./http-session";

/**
 * Coleta HTMLs das turmas virtuais (links no portal) — melhor esforço para R1 deep.
 */
export async function scrapeTurmaVirtualHtmls(
  session: DeviceHttpSession,
  portalHtml: string,
  maxTurmas = 8
): Promise<string[]> {
  const hrefs: string[] = [];
  const re =
    /href=["']([^"']*(?:ava|turmaVirtual|portais\/discente)[^"']*)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(portalHtml)) !== null) {
    if (match[1] && /idTurma|frontEndIdTurma|turma/i.test(match[1])) {
      hrefs.push(match[1]);
    }
  }

  const jsfRe =
    /<a[^>]+id=["']([^"']*turma[^"']*)["'][^>]*href=["']([^"']+)["']/gi;
  while ((match = jsfRe.exec(portalHtml)) !== null) {
    if (match[2]) hrefs.push(match[2]);
  }

  const unique = [...new Set(hrefs)].slice(0, maxTurmas);
  const pages: string[] = [];

  for (const raw of unique) {
    try {
      const url = new URL(raw.replace(/&amp;/g, "&"), SIGAA_PORTAL_DISCENTE_URL);
      const page = await session.request(url.toString(), {
        method: "GET",
        headers: { Referer: SIGAA_PORTAL_DISCENTE_URL },
      });
      if (
        page.response.ok &&
        page.text.length > 500 &&
        !/verTelaLogin\.do/i.test(page.url)
      ) {
        pages.push(page.text);
      }
    } catch {
      /* ignora turma */
    }
  }

  if (pages.length === 0) {
    try {
      const page = await session.request(SIGAA_TURMA_VIRTUAL_URL, {
        method: "GET",
        headers: { Referer: SIGAA_PORTAL_DISCENTE_URL },
      });
      if (page.response.ok && page.text.length > 500) {
        pages.push(page.text);
      }
    } catch {
      /* ignore */
    }
  }

  return pages;
}
