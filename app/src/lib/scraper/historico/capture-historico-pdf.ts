import fs from "node:fs";
import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { submitDiscenteMenuAction } from "@/lib/scraper/portal-discente/submit-portal-menu";
import {
  dismissSigaaCookieBanner,
  dismissSigaaBlockingOverlays,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

const HISTORICO_BEAN_ACTION = "portalDiscente.historico";
const HISTORICO_PDF_TIMEOUT_MS = 35_000;

/**
 * No SIGAA CEFET/UFRN o PDF do histórico costuma baixar logo após
 * Ensino → Emitir Histórico (sem tela intermediária de confirmação).
 */
export async function captureHistoricoPdfFromMenu(page: Page): Promise<Buffer | null> {
  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(500);

  const popupPromise = page
    .context()
    .waitForEvent("page", { timeout: HISTORICO_PDF_TIMEOUT_MS })
    .catch(() => null);

  const downloadPromise = page
    .waitForEvent("download", { timeout: HISTORICO_PDF_TIMEOUT_MS })
    .catch(() => null);

  const responsePromise = page
    .waitForResponse(
      (resp) => {
        const type = resp.headers()["content-type"] ?? "";
        return (
          type.includes("pdf") ||
          type.includes("octet-stream") ||
          /historico|documento|relatorio/i.test(resp.url())
        );
      },
      { timeout: HISTORICO_PDF_TIMEOUT_MS }
    )
    .catch(() => null);

  const clicked = await clickEmitirHistoricoMenu(page);
  if (!clicked) {
    console.warn("[scraper:historico] Menu Ensino → Emitir Histórico não acionado.");
    return null;
  }

  await sleep(1500);

  const download = await downloadPromise;
  if (download) {
    const path = await download.path();
    if (path) return fs.readFileSync(path);
  }

  const response = await responsePromise;
  if (response) {
    const body = Buffer.from(await response.body());
    if (isPdfBuffer(body)) return body;
  }

  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    await sleep(2000);
    const popupPdf = await readPdfFromPage(popup);
    if (popupPdf) {
      await popup.close().catch(() => undefined);
      return popupPdf;
    }
    await popup.close().catch(() => undefined);
  }

  const inline = await readPdfFromPage(page);
  if (inline) return inline;

  return null;
}

async function clickEmitirHistoricoMenu(page: Page): Promise<boolean> {
  if (await submitDiscenteMenuAction(page, HISTORICO_BEAN_ACTION)) {
    return true;
  }

  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(700);
    }

    const emitir = page.getByText(/^Emitir\s+Hist[oó]rico$/i);
    if ((await emitir.count()) === 0) return false;

    await Promise.all([
      page
        .waitForLoadState("domcontentloaded", {
          timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
        })
        .catch(() => undefined),
      emitir.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS }),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function readPdfFromPage(page: Page): Promise<Buffer | null> {
  try {
    const url = page.url();
    if (!url.includes(".pdf") && !/documento|historico|relatorio/i.test(url)) {
      const response = await page
        .goto(url, {
          waitUntil: "load",
          timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
        })
        .catch(() => null);
      if (!response) return null;
      const body = Buffer.from(await response.body());
      return isPdfBuffer(body) ? body : null;
    }

    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    });
    if (!response) return null;

    const body = Buffer.from(await response.body());
    return isPdfBuffer(body) ? body : null;
  } catch {
    return null;
  }
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 4).toString() === "%PDF";
}
