import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import {
  SIGAA_HISTORICO_PDF_PATH,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_DEBUG,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { captureHistoricoPdfFromMenu } from "@/lib/scraper/historico/capture-historico-pdf";
import {
  isHistoricoEmitPage,
  navigateToEmitirHistorico,
} from "@/lib/scraper/historico/navigate-to-historico";
import { parseHistoricoPdfBuffer } from "@/lib/scraper/historico/parse-historico-pdf";
import { buildMockHistoricoSnapshot } from "@/lib/scraper/historico/mock-historico-snapshot";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { countPersistableHistoricoDisciplinas } from "@/lib/sync/historico-snapshot-policy";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

const HISTORICO_PDF_DOWNLOAD_TIMEOUT_MS = 30_000;

/**
 * Navega até Ensino → Emitir Histórico no portal, baixa o PDF e extrai os dados.
 * O PDF do SIGAA costuma baixar direto no clique do menu (sem tela intermediária).
 */
export async function scrapeHistorico(
  page: Page,
  options?: { skipPortalGoto?: boolean }
): Promise<HistoricoSnapshot> {
  if (SIGAA_HISTORICO_PDF_PATH) {
    try {
      const buffer = fs.readFileSync(SIGAA_HISTORICO_PDF_PATH);
      const snapshot = await parseHistoricoPdfBuffer(buffer);
      console.info(
        `[scraper:historico] PDF local: ${snapshot.disciplinas.length} disciplina(s) parseada(s).`
      );
      return snapshot;
    } catch (error) {
      console.warn(
        `[scraper:historico] Falha ao ler PDF local (${SIGAA_HISTORICO_PDF_PATH}):`,
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

    let pdfBuffer = await captureHistoricoPdfFromMenu(page);

    if (!pdfBuffer) {
      console.info(
        "[scraper:historico] PDF direto do menu falhou — tentando tela de emissão."
      );
      const navigated = await navigateToEmitirHistorico(page, {
        skipReturnToPortal: options?.skipPortalGoto,
      });

      if (!navigated) {
        if (SIGAA_SCRAPER_DEBUG) {
          dumpScrapeHtml("historico", "falha-navegacao", await page.content());
        }
        return buildEmptySnapshot("navegação");
      }

      if (await isHistoricoEmitPage(page)) {
        if (SIGAA_SCRAPER_DEBUG) {
          dumpScrapeHtml("historico", "tela-emissao", await page.content());
        }
        pdfBuffer = await downloadHistoricoPdfFromEmitPage(page);
      }
    }

    if (!pdfBuffer) {
      console.warn("[scraper:historico] Não foi possível baixar o PDF do histórico.");
      if (SIGAA_SCRAPER_DEBUG) {
        dumpScrapeHtml("historico", "falha-download", await page.content());
      }
      return buildEmptySnapshot("download");
    }

    saveHistoricoPdfDebug(pdfBuffer);

    const snapshot = await parseHistoricoPdfBuffer(pdfBuffer);
    const persistable = countPersistableHistoricoDisciplinas(snapshot);
    console.info(
      `[scraper:historico] PDF SIGAA: ${snapshot.disciplinas.length} parseada(s), ${persistable} com situação final.`
    );

    if (persistable === 0) {
      console.warn("[scraper:historico] Parser retornou 0 disciplinas persistíveis.");
    }

    return snapshot;
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message = error instanceof Error ? error.message : "Falha ao raspar histórico.";
    console.warn(`[scraper:historico] ${message}`);
    return buildEmptySnapshot("erro");
  }
}

async function downloadHistoricoPdfFromEmitPage(page: Page): Promise<Buffer | null> {
  const popupPromise = page
    .context()
    .waitForEvent("page", { timeout: HISTORICO_PDF_DOWNLOAD_TIMEOUT_MS })
    .catch(() => null);

  const downloadPromise = page
    .waitForEvent("download", { timeout: HISTORICO_PDF_DOWNLOAD_TIMEOUT_MS })
    .catch(() => null);

  const responsePromise = page
    .waitForResponse(
      (resp) =>
        resp.headers()["content-type"]?.includes("pdf") === true ||
        /historico|documento|relatorio/i.test(resp.url()),
      { timeout: HISTORICO_PDF_DOWNLOAD_TIMEOUT_MS }
    )
    .catch(() => null);

  await clickEmitirOnHistoricoPage(page);

  const download = await downloadPromise;
  if (download) {
    const downloadPath = await download.path();
    if (downloadPath) return fs.readFileSync(downloadPath);
  }

  const response = await responsePromise;
  if (response) {
    const contentType = response.headers()["content-type"] ?? "";
    if (contentType.includes("pdf") || response.url().includes("documento")) {
      return Buffer.from(await response.body());
    }
  }

  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    await sleep(2000);
    const popupPdf = await extractPdfBufferFromPage(popup);
    if (popupPdf) {
      await popup.close().catch(() => undefined);
      return popupPdf;
    }
    await popup.close().catch(() => undefined);
  }

  return await extractPdfBufferFromPage(page);
}

async function clickEmitirOnHistoricoPage(page: Page): Promise<void> {
  const clicked = await page.evaluate(() => {
    const isEmitControl = (element: Element): boolean => {
      const label = (
        (element as HTMLInputElement).value ??
        element.textContent ??
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      return (
        /^emitir$/i.test(label) ||
        /emitir\s*(hist[oó]rico|relat[oó]rio)/i.test(label)
      );
    };

    const buttons = Array.from(
      document.querySelectorAll("a, button, input[type='submit'], input[type='button']")
    ).filter(
      (btn) =>
        isEmitControl(btn) &&
        !btn.closest(".ThemeOfficeMenu") &&
        !btn.closest("#menu_form_menu_discente_discente_menu")
    );

    const emitir = buttons[0] as HTMLElement | undefined;
    if (emitir) {
      emitir.click();
      return true;
    }
    return false;
  });

  if (clicked) await sleep(3000);
}

async function extractPdfBufferFromPage(page: Page): Promise<Buffer | null> {
  try {
    const response = await page.goto(page.url(), {
      waitUntil: "load",
      timeout: 30_000,
    });
    if (!response) return null;

    const contentType = response.headers()["content-type"] ?? "";
    if (contentType.includes("pdf")) {
      return Buffer.from(await response.body());
    }

    const body = await response.body();
    if (body.length > 4 && body.subarray(0, 4).toString() === "%PDF") {
      return Buffer.from(body);
    }
  } catch {
    return null;
  }

  return null;
}

function saveHistoricoPdfDebug(buffer: Buffer): void {
  if (!SIGAA_SCRAPER_DEBUG) return;

  const debugDir = path.join(process.cwd(), ".data", "scrape-debug");
  fs.mkdirSync(debugDir, { recursive: true });
  const filename = `${Date.now()}-historico-escolar.pdf`;
  fs.writeFileSync(path.join(debugDir, filename), buffer);
  console.info(`[scraper:debug] PDF salvo: .data/scrape-debug/${filename}`);
}

function buildEmptySnapshot(reason: string): HistoricoSnapshot {
  console.warn(`[scraper:historico] Snapshot vazio (${reason}).`);
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: [],
    chResumo: [],
  };
}

export function scrapeHistoricoMock(): HistoricoSnapshot {
  return buildMockHistoricoSnapshot();
}
