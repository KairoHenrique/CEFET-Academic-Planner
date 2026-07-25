import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import { isTurmasOfertadasPageHtml } from "@/lib/scraper/turmas-ofertadas/is-turmas-ofertadas-page";
import { dismissSigaaCookieBanner, dismissSigaaBlockingOverlays } from "@/lib/scraper/turma-virtual/portal-turma-navigation";

export async function navigateViaMatriculaMenu(
  page: Page,
  options?: {
    password?: string;
    finalAction?: "turmas_estrutura" | "turmas_selecionadas";
  }
): Promise<boolean> {
  try {
    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);
    
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

    await realizarMatriculaLink.first().click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true });
    await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);

    // Passo 2: Confirmar dados e Iniciar
    const pass = options?.password;
    if (pass) {
      let retries = 4;
      while (retries > 0) {
        const passwordInput = page.locator('input[type="password"]').first();
        try {
          await passwordInput.waitFor({ state: "visible", timeout: 2000 });
          await passwordInput.fill(pass);
          await sleep(300);
          
          const confirmarBtn = page.locator('input[value*="Confirmar"], button:has-text("Confirmar")').first();
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
            confirmarBtn.click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true }),
          ]);
        } catch {
          break; // Não achou o input de senha, já passou
        }
        
        retries--;
        await sleep(500); // small delay before checking again
      }
    }

    try {
      await dismissSigaaCookieBanner(page);
      await dismissSigaaBlockingOverlays(page);
      const iniciarBtn = page.locator('input[value*="Iniciar sele"], button:has-text("Iniciar sele")').first();
      await iniciarBtn.waitFor({ state: "visible", timeout: 5000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
        iniciarBtn.click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true }),
      ]);
    } catch {
      // Ignorar caso já esteja na tela
    }

    const finalAction = options?.finalAction ?? "turmas_estrutura";

    if (finalAction === "turmas_estrutura") {
      try {
        const verTurmasBtn = page.locator('input[value*="Ver as turmas da estr"], button:has-text("Ver as turmas da estr"), a:has-text("Ver as turmas da estr")').first();
        await verTurmasBtn.waitFor({ state: "visible", timeout: 5000 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
          verTurmasBtn.click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true }),
        ]);
      } catch {
        // Ignorar
      }
    } else if (finalAction === "turmas_selecionadas") {
      try {
        await dismissSigaaCookieBanner(page);
        await dismissSigaaBlockingOverlays(page);
        const verSelecionadasBtn = page.locator('input[value*="Ver as turmas selecionadas"], button:has-text("Ver as turmas selecionadas"), a:has-text("Ver as turmas selecionadas")').first();
        await verSelecionadasBtn.waitFor({ state: "visible", timeout: 5000 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
          verSelecionadasBtn.click({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS, force: true }),
        ]);
      } catch {
        // Ignorar
      }
    }

    const html = await page.content().catch(() => "");
    return true;
  } catch (error) {
    console.warn("[scraper:turmas] Falha ao navegar pelo fluxo de matrícula", error);
    return false;
  }
}
