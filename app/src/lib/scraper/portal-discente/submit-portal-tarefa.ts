import type { Page } from "playwright";
import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
} from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

const SUCCESS_PATTERN =
  /tarefa\s+enviada|envio\s+realizado|resposta\s+registrada|check\.png/i;

export interface SubmitPortalTarefaInput {
  page: Page;
  sigaaLinkId: string;
  filePath: string;
  comment?: string;
}

async function ensurePortalDiscente(page: Page): Promise<void> {
  if (page.url().includes("discente.jsf")) return;
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await sleep(800);
}

async function openTarefaByLinkId(
  page: Page,
  sigaaLinkId: string
): Promise<void> {
  await ensurePortalDiscente(page);

  const clicked = await page.evaluate((linkId) => {
    const anchor = document.getElementById(linkId) as HTMLAnchorElement | null;
    if (!anchor) return false;
    anchor.click();
    return true;
  }, sigaaLinkId);

  if (!clicked) {
    throw ScraperError.scrapeFailed(
      "Link da tarefa não encontrado no portal. Sincronize novamente."
    );
  }

  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page
    .waitForSelector("fieldset.responderTarefa", { timeout: 20_000 })
    .catch(() => {
      throw ScraperError.scrapeFailed(
        "Página 'Responder tarefa' não abriu no SIGAA."
      );
    });
}

async function fillComentario(page: Page, comment: string): Promise<void> {
  const trimmed = comment.trim();
  if (!trimmed) return;

  const iframe = page.frameLocator('iframe[title*="Editor"], iframe.cke_wysiwyg_frame').first();
  const iframeBody = iframe.locator("body");
  if ((await iframeBody.count()) > 0) {
    await iframeBody.click();
    await iframeBody.fill(trimmed);
    return;
  }

  const textarea = page
    .locator(
      'fieldset.responderTarefa textarea, textarea[id*="coment"], textarea[name*="coment"]'
    )
    .first();
  if ((await textarea.count()) > 0) {
    await textarea.fill(trimmed);
    return;
  }

  const contentEditable = page.locator('[contenteditable="true"]').first();
  if ((await contentEditable.count()) > 0) {
    await contentEditable.click();
    await contentEditable.fill(trimmed);
  }
}

async function clickEnviar(page: Page): Promise<void> {
  const submit = page
    .locator(
      'fieldset.responderTarefa input[type="submit"][value*="Enviar"], fieldset.responderTarefa button:has-text("Enviar"), input[type="submit"][value*="Enviar"]'
    )
    .first();

  if ((await submit.count()) === 0) {
    throw ScraperError.scrapeFailed(
      "Botão Enviar não encontrado na tarefa."
    );
  }

  await submit.click();
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await sleep(1200);
}

async function assertSubmissionSuccess(page: Page): Promise<void> {
  const body = await page.content();
  if (SUCCESS_PATTERN.test(body)) return;
  if (/inv[aá]lid|erro|n[aã]o foi poss/i.test(body)) {
    throw ScraperError.scrapeFailed(
      "SIGAA rejeitou o envio. Verifique arquivo e prazo."
    );
  }
}

/**
 * Envia arquivo + comentário na tela "Responder tarefa" do portal discente.
 */
export async function submitPortalTarefa(
  input: SubmitPortalTarefaInput
): Promise<void> {
  await openTarefaByLinkId(input.page, input.sigaaLinkId);

  const fileInput = page
    .locator('fieldset.responderTarefa input[type="file"]')
    .first();
  if ((await fileInput.count()) === 0) {
    throw ScraperError.scrapeFailed(
      "Campo de arquivo não encontrado (Escolher arquivo)."
    );
  }

  await fileInput.setInputFiles(input.filePath);
  await fillComentario(input.page, input.comment ?? "");
  await clickEnviar(input.page);
  await assertSubmissionSuccess(input.page);
}
