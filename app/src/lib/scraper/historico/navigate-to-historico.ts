import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { submitDiscenteMenuAction } from "@/lib/scraper/portal-discente/submit-portal-menu";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
  returnToPortal,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

const EMITIR_HISTORICO_EXACT = /^Emitir\s+Hist[oó]rico$/i;
const HISTORICO_BEAN_ACTION = "portalDiscente.historico";

export interface NavigateHistoricoOptions {
  skipReturnToPortal?: boolean;
}

/**
 * Fallback: tela intermediária com botão Emitir (algumas instituições).
 */
export async function navigateToEmitirHistorico(
  page: Page,
  options?: NavigateHistoricoOptions
): Promise<boolean> {
  if (!options?.skipReturnToPortal) {
    await returnToPortal(page);
  }

  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(800);

  if (await isHistoricoEmitPage(page)) return true;

  const strategies = [
    () => submitDiscenteMenuAction(page, HISTORICO_BEAN_ACTION),
    () => clickEmitirHistoricoJscook(page),
    () => clickEmitirHistoricoPlaywright(page),
    () => clickEmitirHistoricoDom(page),
  ];

  for (const strategy of strategies) {
    if (await strategy()) {
      await sleep(2000);
      if (await waitHistoricoEmitPage(page)) return true;
    }
  }

  console.warn("[scraper:historico] Tela de emissão não detectada.");
  return false;
}

export async function isHistoricoEmitPage(page: Page): Promise<boolean> {
  const url = page.url();
  if (/historico|relatorio|documento/i.test(url)) return true;

  return page.evaluate(() => {
    const isEmitControl = (element: Element): boolean => {
      const text = (
        (element as HTMLInputElement).value ??
        element.textContent ??
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      return (
        /^emitir$/i.test(text) ||
        /emitir\s*(hist[oó]rico|relat[oó]rio)/i.test(text)
      );
    };

    const emitControls = Array.from(
      document.querySelectorAll(
        "input[type='submit'], input[type='button'], button, a"
      )
    ).filter(
      (element) =>
        isEmitControl(element) &&
        !element.closest(".ThemeOfficeMenu") &&
        !element.closest("#menu_form_menu_discente_discente_menu")
    );

    if (emitControls.length > 0) return true;

    const body = document.body?.innerText ?? "";
    return (
      /hist[oó]rico\s+escolar/i.test(body) ||
      (/download.*hist[oó]rico/i.test(body) && /emitir|ok|confirmar/i.test(body))
    );
  });
}

async function waitHistoricoEmitPage(page: Page): Promise<boolean> {
  const deadline = Date.now() + SIGAA_NAVIGATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isHistoricoEmitPage(page)) return true;
    await sleep(400);
  }

  return isHistoricoEmitPage(page);
}

async function clickEmitirHistoricoJscook(page: Page): Promise<boolean> {
  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(800);
    }

    return page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const target = Array.from(
        document.querySelectorAll("#menu_form_menu_discente_discente_menu td, a, span")
      ).find((el) =>
        /^Emitir\s+Hist[oó]rico$/i.test(normalize(el.textContent ?? ""))
      ) as HTMLElement | undefined;

      if (!target) return false;
      target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      target.click();
      return true;
    });
  } catch {
    return false;
  }
}

async function clickEmitirHistoricoPlaywright(page: Page): Promise<boolean> {
  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(600);
    }

    const emitir = page.getByText(EMITIR_HISTORICO_EXACT);
    if ((await emitir.count()) === 0) return false;

    await emitir.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}

async function clickEmitirHistoricoDom(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const isEmitirHistorico = (text: string) =>
      /^Emitir\s+Hist[oó]rico$/i.test(text.trim());

    const ensino = Array.from(
      document.querySelectorAll("span.ThemeOfficeMainFolderText, td, a")
    ).find((el) => /^Ensino$/i.test(el.textContent?.trim() ?? ""));

    if (ensino) {
      ensino.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      (ensino as HTMLElement).click?.();
    }

    const target = Array.from(document.querySelectorAll("td, a, span")).find(
      (el) => isEmitirHistorico(el.textContent ?? "")
    ) as HTMLElement | undefined;

    if (!target) return false;
    target.click();
    return true;
  });
}
