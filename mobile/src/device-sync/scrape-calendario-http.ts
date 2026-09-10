import { SIGAA_BASE_URL, SIGAA_PORTAL_DISCENTE_URL } from "./constants";
import type { DeviceHttpSession } from "./http-session";

const CAL_LABEL = /Calend[aá]rio\s+Acad[eê]mico/i;

function resolveHref(raw: string, base: string): string {
  try {
    return new URL(raw.replace(/&amp;/g, "&"), base).toString();
  } catch {
    return raw;
  }
}

/**
 * Melhor esforço: HTML do calendário acadêmico a partir de links no portal.
 */
export async function scrapeCalendarioHtmlHttp(
  session: DeviceHttpSession,
  portalHtml: string
): Promise<string | null> {
  const candidates: string[] = [];
  const labeled = portalHtml.match(
    new RegExp(
      `${CAL_LABEL.source}[\\s\\S]{0,240}?href=["']([^"']+)["']|href=["']([^"']+)["'][\\s\\S]{0,240}?${CAL_LABEL.source}`,
      "i"
    )
  );
  if (labeled?.[1] || labeled?.[2]) {
    candidates.push(labeled[1] || labeled[2]!);
  }

  const hrefRe = /href=["']([^"']*calendario[^"']*)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRe.exec(portalHtml)) !== null) {
    if (match[1]) candidates.push(match[1]);
  }

  for (const raw of [...new Set(candidates)].slice(0, 5)) {
    const url = resolveHref(raw, SIGAA_BASE_URL);
    if (!/sig\.cefetmg\.br/i.test(url)) continue;
    try {
      const page = await session.request(url, {
        method: "GET",
        headers: { Referer: SIGAA_PORTAL_DISCENTE_URL },
      });
      if (
        page.response.ok &&
        page.text.length > 800 &&
        /calend[aá]rio|evento|feriado/i.test(page.text)
      ) {
        return page.text;
      }
    } catch {
      /* próximo */
    }
  }

  return null;
}
