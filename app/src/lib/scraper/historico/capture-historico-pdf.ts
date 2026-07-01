import fs from "node:fs";
import type { Download, Page, Response } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { submitDiscenteMenuAction } from "@/lib/scraper/portal-discente/submit-portal-menu";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

const HISTORICO_BEAN_ACTION = "portalDiscente.historico";
const HISTORICO_PDF_TIMEOUT_MS = 35_000;

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 4).toString() === "%PDF";
}

interface PdfCaptureSession {
  waitForPdf: () => Promise<Buffer | null>;
  cancel: () => void;
}

/**
 * Escuta download, popup e todas as respostas HTTP até encontrar um PDF.
 * O POST do menu JSF costuma vir antes do PDF — `waitForResponse` único perde o arquivo.
 */
export function startPdfCapture(page: Page, timeoutMs: number): PdfCaptureSession {
  let settled = false;
  let resolveDone: (buffer: Buffer | null) => void = () => undefined;

  const done = new Promise<Buffer | null>((resolve) => {
    resolveDone = resolve;
  });

  const finish = (buffer: Buffer | null) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    page.off("response", onResponse);
    page.context().off("page", onPopup);
    resolveDone(buffer);
  };

  const onResponse = async (response: Response) => {
    try {
      if (response.request().method() === "HEAD") return;

      const contentType = (response.headers()["content-type"] ?? "").toLowerCase();
      const url = response.url();
      const looksLikePdf =
        contentType.includes("pdf") ||
        contentType.includes("octet-stream") ||
        /\.pdf(?:$|\?)/i.test(url) ||
        /historico|documento|relatorio/i.test(url);

      if (!looksLikePdf) return;

      const body = Buffer.from(await response.body());
      if (isPdfBuffer(body)) finish(body);
    } catch {
      /* corpo já consumido ou resposta abortada */
    }
  };

  const onPopup = async (popup: Page) => {
    try {
      await popup
        .waitForLoadState("domcontentloaded", { timeout: 15_000 })
        .catch(() => undefined);
      await sleep(1500);
      const pdf = await readPdfFromPage(popup);
      if (pdf) {
        await popup.close().catch(() => undefined);
        finish(pdf);
      }
    } catch {
      /* popup sem PDF */
    }
  };

  page.on("response", onResponse);
  page.context().on("page", onPopup);

  void page
    .waitForEvent("download", { timeout: timeoutMs })
    .then(async (download: Download) => {
      const downloadPath = await download.path();
      if (downloadPath) finish(fs.readFileSync(downloadPath));
    })
    .catch(() => undefined);

  const timer = setTimeout(() => finish(null), timeoutMs);

  return {
    waitForPdf: () => done,
    cancel: () => finish(null),
  };
}

/**
 * No SIGAA CEFET/UFRN o PDF do histórico costuma baixar logo após
 * Ensino → Emitir Histórico (sem tela intermediária de confirmação).
 */
export async function captureHistoricoPdfFromMenu(page: Page): Promise<Buffer | null> {
  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(500);

  const capture = startPdfCapture(page, HISTORICO_PDF_TIMEOUT_MS);
  const clicked = await clickEmitirHistoricoMenu(page);

  if (!clicked) {
    capture.cancel();
    console.warn("[scraper:historico] Menu Ensino → Emitir Histórico não acionado.");
    return null;
  }

  await sleep(2000);

  let pdf = await capture.waitForPdf();
  if (pdf) return pdf;

  pdf = await readPdfFromPage(page);
  if (pdf) return pdf;

  return readPdfFromEmbeddedViewer(page);
}

/** Usado na tela intermediária de emissão (botão Emitir). */
export async function captureHistoricoPdfAfterEmitClick(
  page: Page
): Promise<Buffer | null> {
  const capture = startPdfCapture(page, HISTORICO_PDF_TIMEOUT_MS);
  await clickEmitirOnHistoricoPage(page);
  await sleep(2000);

  let pdf = await capture.waitForPdf();
  if (pdf) return pdf;

  pdf = await readPdfFromPage(page);
  if (pdf) return pdf;

  return readPdfFromEmbeddedViewer(page);
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

export async function readPdfFromPage(page: Page): Promise<Buffer | null> {
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

async function readPdfFromEmbeddedViewer(page: Page): Promise<Buffer | null> {
  try {
    const embeddedUrl = await page.evaluate(() => {
      const candidate = document.querySelector(
        "iframe[src], embed[src], object[data]"
      ) as HTMLIFrameElement | HTMLEmbedElement | HTMLObjectElement | null;

      const raw =
        candidate?.getAttribute("src") ?? candidate?.getAttribute("data") ?? "";
      return raw.trim() || null;
    });

    if (!embeddedUrl) return null;

    const absolute = new URL(embeddedUrl, page.url()).toString();
    const response = await page
      .context()
      .request.get(absolute)
      .catch(() => null);
    if (!response?.ok()) return null;

    const body = Buffer.from(await response.body());
    return isPdfBuffer(body) ? body : null;
  } catch {
    return null;
  }
}
