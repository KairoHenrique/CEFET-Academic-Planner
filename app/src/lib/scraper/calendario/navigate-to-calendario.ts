import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import {
  isCalendarioDetailPage,
  isCalendarioListPage,
  waitForCalendarioListPage,
} from "@/lib/scraper/calendario/open-calendario-detail";
import { submitDiscenteMenuAction } from "@/lib/scraper/portal-discente/submit-portal-menu";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
  returnToPortal,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

/** Bean action real do menu Ensino → Calendário Acadêmico (SIGAA CEFET). */
const CALENDARIO_BEAN_ACTION = "calendario.iniciarBusca";

const CALENDARIO_LABEL = /^Calend[aá]rio\s+Acad[eê]mico$/i;

export interface NavigateCalendarioOptions {
  skipReturnToPortal?: boolean;
  semestresAlvo?: string[];
}

export async function navigateToCalendarioAcademico(
  page: Page,
  options?: NavigateCalendarioOptions
): Promise<boolean> {
  if (!options?.skipReturnToPortal) {
    await returnToPortal(page);
  }

  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(800);

  if (await isCalendarioDetailPage(page)) return true;

  if (await submitDiscenteMenuAction(page, CALENDARIO_BEAN_ACTION)) {
    await sleep(1200);
    if (await waitForCalendarioListPage(page)) return true;
    if (await isCalendarioDetailPage(page)) return true;
  }

  if (await clickCalendarioMenuItem(page)) {
    await sleep(1200);
    if (await waitForCalendarioListPage(page)) return true;
    if (await isCalendarioDetailPage(page)) return true;
  }

  console.warn("[scraper:calendario] Tela de calendário acadêmico não detectada.");
  return false;
}

export async function isCalendarioAcademicoPage(page: Page): Promise<boolean> {
  if (await isCalendarioDetailPage(page)) return true;
  return isCalendarioListPage(page);
}

export async function returnToCalendarioList(page: Page): Promise<boolean> {
  if (await isCalendarioListPage(page)) return true;

  const voltar = page.getByRole("link", { name: /voltar/i });
  if ((await voltar.count()) > 0) {
    try {
      await voltar.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
      await sleep(1200);
      if (await waitForCalendarioListPage(page)) return true;
    } catch {
      // tenta bean action abaixo
    }
  }

  if (await submitDiscenteMenuAction(page, CALENDARIO_BEAN_ACTION)) {
    await sleep(1200);
    return waitForCalendarioListPage(page);
  }

  return false;
}

async function clickCalendarioMenuItem(page: Page): Promise<boolean> {
  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(700);
    }

    const link = page.getByText(CALENDARIO_LABEL);
    if ((await link.count()) === 0) return false;
    await link.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}
