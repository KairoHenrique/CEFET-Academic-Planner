import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import { isTurmasOfertadasPageHtml } from "@/lib/scraper/turmas-ofertadas/is-turmas-ofertadas-page";

export async function navigateViaMatriculaMenu(
  page: Page,
  options?: {
    password?: string;
    finalAction?: "turmas_estrutura" | "turmas_selecionadas";
  }
): Promise<boolean> {
  try {
    const ensino = page.locator("span.ThemeOfficeMainFolderText, td.ThemeOfficeMainFolderText", {
      hasText: /^Ensino$/i,
    });
    if ((await ensino.count()) > 0) {
      await ensino.first().hover({ timeout: 5000 });
      await sleep(700);
    }

    const matriculaMenu = page.locator("span.ThemeOfficeMenuFolderText, td.ThemeOfficeMenuFolderText", {
      hasText: /Matr[ií]cula On-?Line/i,
    });
    if ((await matriculaMenu.count()) > 0) {
      await matriculaMenu.first().hover({ timeout: 5000 });
      await sleep(700);
    }

    const realizarMatriculaLink = page.getByText(/Realizar Matr[ií]cula/i).filter({
      hasNotText: /Trancamento/i
    });
    if ((await realizarMatriculaLink.count()) === 0) return false;

    await realizarMatriculaLink.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS });
    await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);

    // Passo 2: Confirmar dados e Iniciar
    const pass = options?.password;
    if (pass) {
      let retries = 4;
      while (retries > 0) {
        const passwordInput = page.locator('input[type="password"]');
        if ((await passwordInput.count()) === 0) break;

        await passwordInput.first().fill(pass);
        await sleep(300);
        
        const confirmarBtn = page.locator('input[value*="Confirmar"], button:has-text("Confirmar")');
        if ((await confirmarBtn.count()) > 0) {
          await confirmarBtn.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true });
          await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
        }
        
        retries--;
        await sleep(500); // small delay before checking again
      }
    }

    const iniciarBtn = page.locator('input[value*="Iniciar sele"], button:has-text("Iniciar sele")');
    if ((await iniciarBtn.count()) > 0) {
      await iniciarBtn.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true });
      await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
    }

    const finalAction = options?.finalAction ?? "turmas_estrutura";

    if (finalAction === "turmas_estrutura") {
      const verTurmasBtn = page.locator('input[value*="Ver as turmas da estr"], button:has-text("Ver as turmas da estr"), a:has-text("Ver as turmas da estr")');
      if ((await verTurmasBtn.count()) > 0) {
        await verTurmasBtn.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true });
        await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
      }
    } else if (finalAction === "turmas_selecionadas") {
      const verSelecionadasBtn = page.locator('input[value*="Ver as turmas selecionadas"], button:has-text("Ver as turmas selecionadas"), a:has-text("Ver as turmas selecionadas")');
      if ((await verSelecionadasBtn.count()) > 0) {
        await verSelecionadasBtn.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true });
        await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
      }
    }

    const html = await page.content().catch(() => "");
    return true;
  } catch (error) {
    console.warn("[scraper:turmas] Falha ao navegar pelo fluxo de matrícula", error);
    return false;
  }
}
