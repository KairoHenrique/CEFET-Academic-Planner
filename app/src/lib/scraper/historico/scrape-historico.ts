import fs from "node:fs";
import type { Page } from "playwright";
import {
  SIGAA_HISTORICO_PDF_PATH,
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { parseHistoricoPdfText } from "@/lib/scraper/historico/parse-historico-pdf";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

/**
 * Navega até "Ensino → Emitir Histórico" no SIGAA, baixa o PDF gerado,
 * e extrai os dados do histórico escolar.
 */
export async function scrapeHistorico(page: Page): Promise<HistoricoSnapshot> {
  if (SIGAA_HISTORICO_PDF_PATH) {
    try {
      const buffer = fs.readFileSync(SIGAA_HISTORICO_PDF_PATH);
      return await parseHistoricoPdfBuffer(buffer);
    } catch (error) {
      console.warn(
        `[scraper:historico] Falha ao ler PDF local (${SIGAA_HISTORICO_PDF_PATH}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    // 1. Ir para o portal (ponto de partida para navegar ao menu Ensino)
    if (!page.url().includes("sigaa")) {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      });
    }

    // 2. Navegar para Ensino → Emitir Histórico
    // No SIGAA, o menu Ensino fica no topo. Tentar clicar.
    const ensinoClicked = await page.evaluate(() => {
      const clickElement = (pattern: RegExp) => {
        const elements = Array.from(document.querySelectorAll("a, td, span, div, li"));
        const target = elements.find((el) =>
          pattern.test(el.textContent?.trim() ?? "") &&
          (el as HTMLElement).click !== undefined
        ) as HTMLElement | undefined;
        if (target) {
          target.click();
          return true;
        }
        return false;
      };

      if (clickElement(/emitir\s*hist[oó]rico/i)) return true;
      if (clickElement(/^ensino$/i)) return false;

      return false;
    });

    if (!ensinoClicked) {
      await sleep(1500);

      const historicoClicked = await page.evaluate(() => {
        const clickElement = (pattern: RegExp) => {
          const elements = Array.from(document.querySelectorAll("a, td, span, div, li"));
          const target = elements.find((el) =>
            pattern.test(el.textContent?.trim() ?? "") &&
            !/turma|virtual|portal/i.test(el.textContent?.trim() ?? "") &&
            (el as HTMLElement).click !== undefined
          ) as HTMLElement | undefined;
          if (target) {
            target.click();
            return true;
          }
          return false;
        };

        if (clickElement(/emitir\s*hist[oó]rico/i)) return true;
        if (clickElement(/hist[oó]rico/i)) return true;


        return false;
      });

      if (!historicoClicked) {
        console.warn("[scraper:historico] Não encontrou link 'Emitir Histórico' no menu.");
        return buildEmptySnapshot();
      }
    }

    await sleep(2000);
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);

    // 3. A página pode ter um botão "Emitir" ou já gerar o PDF
    // Interceptar o download do PDF
    const pdfBuffer = await downloadHistoricoPdf(page);
    if (!pdfBuffer) {
      console.warn("[scraper:historico] Não foi possível baixar o PDF do histórico.");
      return buildEmptySnapshot();
    }

    return await parseHistoricoPdfBuffer(pdfBuffer);
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message = error instanceof Error ? error.message : "Falha ao raspar histórico.";
    console.warn(`[scraper:historico] ${message}`);
    return buildEmptySnapshot();
  }
}

async function parseHistoricoPdfBuffer(buffer: Buffer): Promise<HistoricoSnapshot> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const pdfData = await pdfParse(buffer);
  return parseHistoricoPdfText(pdfData.text);
}

/**
 * O SIGAA gera o PDF inline ou como download.
 */
async function downloadHistoricoPdf(page: Page): Promise<Buffer | null> {
  // Verificar se a página atual já é o PDF ou tem link para ele
  const currentUrl = page.url();

  // Caso 1: A URL atual já é um PDF
  if (currentUrl.endsWith(".pdf") || currentUrl.includes("documento")) {
    try {
      const response = await page.goto(currentUrl, {
        waitUntil: "load",
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      });
      if (response) {
        return Buffer.from(await response.body());
      }
    } catch {
      // Continuar para outros métodos
    }
  }

  // Caso 2: Há um botão/link "Emitir" ou "Gerar" na página
  const downloadPromise = page.waitForEvent("download", { timeout: 15_000 }).catch(() => null);

  const emitirClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("a, button, input[type='submit'], input[type='button']"));
    const emitir = buttons.find((btn) =>
      /emitir|gerar|baixar|download|imprimir/i.test(
        (btn.textContent ?? (btn as HTMLInputElement).value ?? "").trim()
      )
    ) as HTMLElement | undefined;
    if (emitir) {
      emitir.click();
      return true;
    }
    return false;
  });

  if (emitirClicked) {
    const download = await downloadPromise;
    if (download) {
      const path = await download.path();
      if (path) {
        const fs = await import("fs");
        return fs.readFileSync(path);
      }
    }

    // Pode ter aberto em nova aba ou carregado inline
    await sleep(3000);
  }

  // Caso 3: Tentar capturar resposta PDF via interceptação de requests
  try {
    const response = await page.waitForResponse(
      (resp) =>
        resp.url().includes("historico") ||
        resp.url().includes("documento") ||
        resp.headers()["content-type"]?.includes("pdf") === true,
      { timeout: 10_000 }
    );
    return Buffer.from(await response.body());
  } catch {
    // Nenhum PDF encontrado
  }

  // Caso 4: Verificar se há um iframe/embed com PDF
  const pdfUrl = await page.evaluate(() => {
    const embed = document.querySelector("embed[type='application/pdf']") as HTMLEmbedElement | null;
    if (embed?.src) return embed.src;

    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe?.src?.includes("pdf")) return iframe.src;

    // Verificar links diretos para PDF
    const links = Array.from(document.querySelectorAll("a"));
    const pdfLink = links.find((link) => link.href?.includes(".pdf") || link.href?.includes("documento"));
    return pdfLink?.href ?? null;
  });

  if (pdfUrl) {
    try {
      const response = await page.goto(pdfUrl, {
        waitUntil: "load",
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      });
      if (response) {
        return Buffer.from(await response.body());
      }
    } catch {
      // Falhou
    }
  }

  return null;
}

function buildEmptySnapshot(): HistoricoSnapshot {
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: [],
    chResumo: [],
  };
}

/**
 * Mock do histórico — para testes sem SIGAA.
 */
export function scrapeHistoricoMock(): HistoricoSnapshot {
  return buildEmptySnapshot();
}
