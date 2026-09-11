import type { Page } from "playwright";
import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
} from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

/** Envio costuma precisar de mais folga que o scrape leve. */
const SUBMIT_NAV_TIMEOUT_MS = Math.max(SIGAA_NAVIGATION_TIMEOUT_MS, 90_000);

const SUCCESS_PATTERN =
  /tarefa\s+enviada|envio\s+realizado|resposta\s+registrada|check\.png/i;

export interface SubmitPortalTarefaInput {
  page: Page;
  sigaaLinkId: string;
  /** Título da tarefa — fallback quando o linkId JSF muda entre sessões. */
  tarefaTitulo?: string | null;
  filePath: string;
  comment?: string;
  /**
   * Abre a tela, anexa arquivo e valida o formulário — **não** clica em Enviar.
   * Serve para testar o robô sem consumir a entrega no SIGAA.
   */
  dryRun?: boolean;
}

function normalizeTitulo(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

async function ensurePortalDiscente(page: Page): Promise<void> {
  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);

  const hasAtividades = (await page.locator("#formAtividades").count()) > 0;
  if (!page.url().includes("discente.jsf") || !hasAtividades) {
    try {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: SUBMIT_NAV_TIMEOUT_MS,
      });
    } catch {
      throw ScraperError.timeout(
        "O SIGAA demorou para abrir o portal. Aguarde um minuto e tente de novo."
      );
    }
    await sleep(1000);
  }

  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);

  try {
    await page.waitForSelector("#formAtividades", {
      timeout: SUBMIT_NAV_TIMEOUT_MS,
    });
  } catch {
    throw ScraperError.scrapeFailed(
      "Não foi possível abrir a lista de atividades no SIGAA. Sincronize e tente enviar de novo."
    );
  }
}

async function collectTarefaLinks(
  page: Page
): Promise<Array<{ linkId: string; titulo: string }>> {
  return page.evaluate(() => {
    const form = document.getElementById("formAtividades");
    if (!form) return [];
    return Array.from(
      form.querySelectorAll(
        'a[id*="visualizarTarefa"], a[id*="visualizarQuestionario"], a[id*="visualizarAvaliacao"]'
      )
    )
      .map((anchor) => ({
        linkId: (anchor as HTMLAnchorElement).id,
        titulo: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.linkId && item.titulo);
  });
}

async function clickTarefaLink(page: Page, linkId: string): Promise<boolean> {
  return page.evaluate((id) => {
    const anchor = document.getElementById(id) as HTMLAnchorElement | null;
    if (!anchor) return false;
    anchor.click();
    return true;
  }, linkId);
}

async function resolveTarefaLinkId(
  page: Page,
  sigaaLinkId: string,
  tarefaTitulo?: string | null
): Promise<string | null> {
  const links = await collectTarefaLinks(page);
  if (links.length === 0) return null;

  const wanted = tarefaTitulo?.trim()
    ? normalizeTitulo(tarefaTitulo)
    : null;

  // Título primeiro — linkId JSF muda entre sessões.
  if (wanted) {
    const byTitle =
      links.find((item) => normalizeTitulo(item.titulo) === wanted) ??
      links.find((item) => normalizeTitulo(item.titulo).includes(wanted)) ??
      links.find((item) => wanted.includes(normalizeTitulo(item.titulo)));
    if (byTitle) return byTitle.linkId;
  }

  if (sigaaLinkId && links.some((item) => item.linkId === sigaaLinkId)) {
    return sigaaLinkId;
  }

  return null;
}

async function openTarefaByLinkId(
  page: Page,
  sigaaLinkId: string,
  tarefaTitulo?: string | null
): Promise<void> {
  await ensurePortalDiscente(page);

  const linkId = await resolveTarefaLinkId(page, sigaaLinkId, tarefaTitulo);
  if (!linkId) {
    throw ScraperError.scrapeFailed(
      "Link da tarefa não encontrado no portal. Sincronize novamente e tente de novo."
    );
  }

  const navigation = page
    .waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: SUBMIT_NAV_TIMEOUT_MS,
    })
    .catch(() => null);

  const clicked = await clickTarefaLink(page, linkId);
  if (!clicked) {
    throw ScraperError.scrapeFailed(
      "Não foi possível abrir a tarefa no SIGAA. Sincronize e tente de novo."
    );
  }

  await navigation;
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await dismissSigaaBlockingOverlays(page);

  try {
    await page.waitForSelector("fieldset.responderTarefa", {
      timeout: SUBMIT_NAV_TIMEOUT_MS,
    });
  } catch {
    throw ScraperError.scrapeFailed(
      "A página de envio da tarefa não abriu no SIGAA. Confira se o prazo ainda está aberto e tente de novo."
    );
  }
}

async function fillComentario(page: Page, comment: string): Promise<void> {
  const trimmed = comment.trim();
  if (!trimmed) return;

  const iframe = page
    .frameLocator('iframe[title*="Editor"], iframe.cke_wysiwyg_frame')
    .first();
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
    .locator("fieldset.responderTarefa")
    .locator(
      'input[type="submit"][value*="Enviar"], button:has-text("Enviar")'
    )
    .first();

  if ((await submit.count()) === 0) {
    throw ScraperError.scrapeFailed(
      "Botão Enviar não encontrado na tarefa."
    );
  }

  const navigation = page
    .waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: SUBMIT_NAV_TIMEOUT_MS,
    })
    .catch(() => null);

  await submit.click({ force: false, timeout: SUBMIT_NAV_TIMEOUT_MS });
  await navigation;
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await sleep(1200);
}

async function assertSubmissionSuccess(page: Page): Promise<void> {
  const body = await page.content();
  if (SUCCESS_PATTERN.test(body)) return;

  if (
    /j[aá]\s+enviou\s+sua\s+resposta|n[aã]o\s+aceita\s+mais\s+de\s+um\s+envio/i.test(
      body
    )
  ) {
    return;
  }

  const fieldset = await page
    .locator("fieldset.responderTarefa")
    .innerText()
    .catch(() => "");
  const combined = `${fieldset}\n${body}`;

  if (
    /prazo\s+(encerrado|expirado)|arquivo\s+(inv[aá]lido|obrigat)/i.test(
      combined
    )
  ) {
    throw ScraperError.scrapeFailed(
      "SIGAA rejeitou o envio. Verifique arquivo e prazo."
    );
  }

  // Se o fieldset de resposta sumiu, assume sucesso (portal voltou à lista).
  if (!(await page.locator("fieldset.responderTarefa").count())) {
    return;
  }

  throw ScraperError.scrapeFailed(
    "Não foi possível confirmar o envio no SIGAA."
  );
}

/**
 * Envia arquivo + comentário na tela "Responder tarefa" do portal discente.
 */
export async function submitPortalTarefa(
  input: SubmitPortalTarefaInput
): Promise<void> {
  await openTarefaByLinkId(input.page, input.sigaaLinkId, input.tarefaTitulo);

  const fileInput = input.page
    .locator('fieldset.responderTarefa input[type="file"]')
    .first();
  if ((await fileInput.count()) === 0) {
    throw ScraperError.scrapeFailed(
      "Campo de arquivo não encontrado. Confira se a tarefa ainda aceita envio no SIGAA."
    );
  }

  await fileInput.setInputFiles(input.filePath);
  await fillComentario(input.page, input.comment ?? "");

  if (input.dryRun) {
    await ensurePortalDiscente(input.page);
    return;
  }

  await clickEnviar(input.page);
  await assertSubmissionSuccess(input.page);
}
