import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
  returnToPortal,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

const OUTROS_LABEL = /^Outros$/i;
const SALDO_RU_LABEL = /Saldo\s+do\s+Cart[aã]o\s+do\s+Restaurante/i;
const REFEICOES_LABEL = /Refei[cç][oõ]es?\s+Dispon[ií]veis/i;

export interface RuSaldoSnapshot {
  refeicoesDisponiveis: number;
}

/**
 * Portal discente → Outros → Saldo do Cartão do Restaurante (SIPAC)
 * → lê só "Refeições Disponíveis".
 */
export async function scrapeSaldoRu(
  page: Page,
  options?: { skipReturnToPortal?: boolean }
): Promise<RuSaldoSnapshot> {
  if (!options?.skipReturnToPortal) {
    await returnToPortal(page);
  }

  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(500);

  const opened = await openSaldoRuPage(page);
  if (!opened) {
    throw new Error(
      "Não foi possível abrir Saldo do Cartão do Restaurante no SIGAA."
    );
  }

  await page
    .waitForLoadState("domcontentloaded", {
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    })
    .catch(() => undefined);
  await sleep(800);

  const refeicoes = await extractRefeicoesDisponiveis(page);
  if (refeicoes == null) {
    throw new Error(
      'Campo "Refeições Disponíveis" não encontrado na página do RU.'
    );
  }

  return { refeicoesDisponiveis: refeicoes };
}

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

async function openSaldoRuPage(page: Page): Promise<boolean> {
  const strategies = [
    () => clickOutrosThenSaldo(page),
    () => clickSaldoByText(page),
  ];

  for (const strategy of strategies) {
    try {
      if (await strategy()) {
        await sleep(1500);
        if (await isSaldoRuPage(page)) return true;
      }
    } catch {
      /* tenta próxima */
    }
  }

  return isSaldoRuPage(page);
}

async function clickOutrosThenSaldo(page: Page): Promise<boolean> {
  const outros = page.locator("span.ThemeOfficeMainFolderText", {
    hasText: OUTROS_LABEL,
  });
  if ((await outros.count()) === 0) {
    const fallback = page.getByText(OUTROS_LABEL);
    if ((await fallback.count()) === 0) return false;
    await fallback.first().hover({ timeout: 5000 }).catch(() => undefined);
    await fallback.first().click({ timeout: 5000 }).catch(() => undefined);
  } else {
    await outros.first().hover({ timeout: 5000 });
    await sleep(600);
  }

  await sleep(400);

  const saldo = page.getByText(SALDO_RU_LABEL);
  if ((await saldo.count()) === 0) {
    return page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const target = Array.from(
        document.querySelectorAll(
          "#menu_form_menu_discente_discente_menu td, a, span, li"
        )
      ).find((el) =>
        /Saldo\s+do\s+Cart[aã]o\s+do\s+Restaurante/i.test(
          normalize(el.textContent ?? "")
        )
      ) as HTMLElement | undefined;
      if (!target) return false;
      target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      target.click();
      return true;
    });
  }

  await saldo.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
  return true;
}

async function clickSaldoByText(page: Page): Promise<boolean> {
  const saldo = page.getByText(SALDO_RU_LABEL);
  if ((await saldo.count()) === 0) return false;
  await saldo.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
  return true;
}

async function isSaldoRuPage(page: Page): Promise<boolean> {
  const url = page.url();
  if (/sipac|restaurante|cartao/i.test(url)) return true;

  return page.evaluate(() => {
    const body = document.body?.innerText ?? "";
    return /Refei[cç][oõ]es?\s+Dispon[ií]veis/i.test(body);
  });
}

async function extractRefeicoesDisponiveis(page: Page): Promise<number | null> {
  const fromDom = await page.evaluate(() => {
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
    const body = normalize(document.body?.innerText ?? "");
    const match = body.match(
      /Refei[cç][oõ]es?\s+Dispon[ií]veis\s*[:：]?\s*(\d{1,4})/i
    );
    if (match?.[1]) return Number(match[1]);

    const rows = Array.from(document.querySelectorAll("tr, li, p, div, td, span"));
    for (const row of rows) {
      const text = normalize(row.textContent ?? "");
      if (!/Refei[cç][oõ]es?\s+Dispon[ií]veis/i.test(text)) continue;
      const valueMatch = text.match(/(\d{1,4})\s*$/) ?? text.match(/(\d{1,4})/);
      if (valueMatch?.[1]) return Number(valueMatch[1]);
    }
    return null;
  });

  if (fromDom != null && Number.isFinite(fromDom)) return fromDom;

  const html = await page.content();
  return parseRefeicoesDisponiveisFromHtml(html);
}
