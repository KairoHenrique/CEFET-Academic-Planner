import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { submitDiscenteMenuAction } from "@/lib/scraper/portal-discente/submit-portal-menu";
import {
  isTurmasOfertadasPageHtml,
} from "@/lib/scraper/turmas-ofertadas/is-turmas-ofertadas-page";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
  returnToPortal,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

/** Bean Ensino → Consultar Turmas do Próx. Semestre (SIGAA CEFET). */
export const TURMAS_OFERTADAS_BEAN_ACTION =
  "solicitacaoTurma.iniciarListaSolicitacoesCursoPortalDiscente";

const TURMAS_MENU_LABEL =
  /Consultar Turmas do Pr[oó]x\.?\s*Semestre/i;

export async function navigateToTurmasOfertadas(
  page: Page,
  options?: { skipReturnToPortal?: boolean }
): Promise<boolean> {
  if (!options?.skipReturnToPortal) {
    await returnToPortal(page);
  }

  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(800);

  const currentHtml = await page.content().catch(() => "");
  if (isTurmasOfertadasPageHtml(currentHtml)) return true;

  if (await submitDiscenteMenuAction(page, TURMAS_OFERTADAS_BEAN_ACTION)) {
    await sleep(1200);
    const html = await page.content().catch(() => "");
    if (isTurmasOfertadasPageHtml(html)) return true;
  }

  if (await clickTurmasMenuItem(page)) {
    await sleep(1200);
    const html = await page.content().catch(() => "");
    if (isTurmasOfertadasPageHtml(html)) return true;
  }

  console.warn("[scraper:turmas] Tela de turmas ofertadas não detectada.");
  return false;
}

async function clickTurmasMenuItem(page: Page): Promise<boolean> {
  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(700);
    }

    const link = page.getByText(TURMAS_MENU_LABEL);
    if ((await link.count()) === 0) return false;
    await link.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}
