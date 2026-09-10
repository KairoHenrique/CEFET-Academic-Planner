import { SIGAA_BASE_URL, SIGAA_PORTAL_DISCENTE_URL } from "./constants";
import type { DeviceHttpSession } from "./http-session";

const SALDO_HREF_PATTERN =
  /href=["']([^"']*(?:saldo|cartao|restaurante|sipac)[^"']*)["']/i;
const SALDO_LABEL = /Saldo\s+do\s+Cart[aã]o\s+do\s+Restaurante/i;

export function parseRefeicoesDisponiveisFromHtml(html: string): number | null {
  const text = html.replace(/\s+/g, " ");
  const patterns = [
    /Refei[cç][oõ]es?\s+Dispon[ií]veis\s*[:：]?\s*<\/?\w*[^>]*>\s*(\d{1,4})/i,
    /Refei[cç][oõ]es?\s+Dispon[ií]veis\s*[:：]\s*(\d{1,4})/i,
    /Refei[cç][oõ]es?\s+Dispon[ií]veis[^0-9]{0,80}(\d{1,4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value >= 0 && value < 10_000) return value;
    }
  }
  return null;
}

function resolveHref(raw: string, base: string): string {
  try {
    return new URL(raw.replace(/&amp;/g, "&"), base).toString();
  } catch {
    return raw;
  }
}

/**
 * Melhor esforço: achar link do saldo no HTML do portal e abrir.
 * Retorna null se o menu JSF exigir hover (Playwright) — sync segue sem RU.
 */
export async function scrapeRuSaldoHttp(
  session: DeviceHttpSession,
  portalHtml: string
): Promise<number | null> {
  const fromPortal = parseRefeicoesDisponiveisFromHtml(portalHtml);
  if (fromPortal != null) return fromPortal;

  const candidates: string[] = [];
  const labeled = portalHtml.match(
    new RegExp(
      `${SALDO_LABEL.source}[\\s\\S]{0,200}?href=["']([^"']+)["']|href=["']([^"']+)["'][\\s\\S]{0,200}?${SALDO_LABEL.source}`,
      "i"
    )
  );
  if (labeled?.[1] || labeled?.[2]) {
    candidates.push(labeled[1] || labeled[2]!);
  }

  let match: RegExpExecArray | null;
  const hrefRe = new RegExp(SALDO_HREF_PATTERN.source, "gi");
  while ((match = hrefRe.exec(portalHtml)) !== null) {
    if (match[1]) candidates.push(match[1]);
  }

  for (const raw of candidates.slice(0, 6)) {
    const url = resolveHref(raw, SIGAA_PORTAL_DISCENTE_URL);
    if (!/sig\.cefetmg\.br|sipac/i.test(url)) continue;
    try {
      const page = await session.request(url, {
        method: "GET",
        headers: { Referer: SIGAA_PORTAL_DISCENTE_URL },
      });
      const value = parseRefeicoesDisponiveisFromHtml(page.text);
      if (value != null) return value;
    } catch {
      /* tenta próximo */
    }
  }

  // Fallback: URL conhecida do SIPAC saldo (pode variar por campus).
  const sipacGuesses = [
    "https://sig.cefetmg.br/sipac/",
    `${SIGAA_BASE_URL}verPortalDiscente.do`,
  ];
  for (const url of sipacGuesses) {
    try {
      const page = await session.request(url, {
        method: "GET",
        headers: { Referer: SIGAA_PORTAL_DISCENTE_URL },
      });
      const value = parseRefeicoesDisponiveisFromHtml(page.text);
      if (value != null) return value;
    } catch {
      /* ignore */
    }
  }

  return null;
}
