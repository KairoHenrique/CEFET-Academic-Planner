import type { Page } from "playwright";
import {
  SIGAA_LOGIN_TIMEOUT_MS,
  SIGAA_LOGIN_URL,
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_SCRAPER_MOCK,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import type { SigaaCredentials, SigaaSession } from "@/lib/scraper/types";

const LOGIN_ERROR_PATTERN =
  /inv[aá]lid|incorret|autentica[cç][aã]o|n[aã]o foi poss[ií]vel|falha na autentica/i;

async function fillLoginForm(
  page: Page,
  credentials: SigaaCredentials
): Promise<void> {
  const usernameField = page
    .getByLabel(/usu[aá]rio/i)
    .or(page.locator('input[name="username"]'))
    .or(page.locator('input[type="text"]'))
    .first();

  const passwordField = page
    .getByLabel(/senha/i)
    .or(page.locator('input[name="password"]'))
    .or(page.locator('input[type="password"]'))
    .first();

  await usernameField.waitFor({ state: "visible", timeout: 30_000 });
  await usernameField.fill(credentials.username);
  await passwordField.fill(credentials.password);
}

async function submitLoginForm(page: Page): Promise<void> {
  const submitButton = page
    .getByRole("button", { name: /entrar/i })
    .or(page.locator('input[type="submit"]'))
    .first();

  await submitButton.click();
}

async function detectLoginFailure(page: Page): Promise<void> {
  const body = await page.content();
  if (LOGIN_ERROR_PATTERN.test(body)) {
    throw ScraperError.invalidCredentials();
  }
}

const MAX_PENDING_NOTIFICATIONS = 5;

async function isPendingNotificationPage(page: Page): Promise<boolean> {
  if (page.url().includes("notificacoes_academicas")) return true;
  return (
    (await page
      .locator('form[action*="notificacoes_pendentes"]')
      .count()) > 0
  );
}

/**
 * O SIGAA pode interceptar o pós-login com "Notificações Acadêmicas"
 * pendentes (avisos institucionais) que exigem confirmar a senha e
 * "Confirmar Leitura" antes de liberar o Portal do Discente. Sem isso,
 * toda navegação cai de volta no aviso e o scrape retorna vazio.
 */
async function dismissPendingNotifications(
  page: Page,
  credentials: SigaaCredentials
): Promise<void> {
  for (let attempt = 0; attempt < MAX_PENDING_NOTIFICATIONS; attempt++) {
    if (!(await isPendingNotificationPage(page))) return;

    console.info(
      "[scraper:auth] Notificação acadêmica pendente — confirmando leitura."
    );

    // Submit JSF manual (equivalente ao jsfcljs do onclick): preenche a
    // senha, injeta o parâmetro do botão e submete o form. O clique
    // "actionable" do Playwright falha por overlays; onclick depende de
    // helpers globais que podem não ter carregado.
    const submitted = await page.evaluate((senha) => {
      // 1. Tentar form de questionário (requer senha)
      const form = document.querySelector<HTMLFormElement>(
        'form[action*="notificacoes_pendentes"]'
      );
      if (form) {
        const senhaInput = form.querySelector<HTMLInputElement>(
          'input[type="password"]'
        );
        if (senhaInput) senhaInput.value = senha;

        const link = form.querySelector<HTMLAnchorElement>(
          'a[id$="btnResponderQuestionario"]'
        );
        const paramName = link?.id;
        if (paramName) {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = paramName;
          hidden.value = paramName;
          form.appendChild(hidden);
        }

        form.submit();
        return true;
      }

      // 2. Tentar botão genérico de "Estou Ciente" ou "Ciente" (sem senha)
      const elements = Array.from(document.querySelectorAll('input[type="submit"], button, a, input[type="button"]'));
      for (const el of elements) {
        const text = (el.textContent || (el as HTMLInputElement).value || '').toLowerCase().trim();
        if (text === 'ciente' || text === 'estou ciente' || text === 'confirmar leitura' || text === 'li e concordo') {
          (el as HTMLElement).click();
          return true;
        }
      }

      return false;
    }, credentials.password);

    if (!submitted) return;

    // Submit JSF pode demorar — espera o form sumir sem abortar o login.
    await page
      .waitForSelector('form[action*="notificacoes_pendentes"]', {
        state: "detached",
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      })
      .catch(() => undefined);
    await page
      .waitForLoadState("domcontentloaded", {
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      })
      .catch(() => undefined);

    dumpScrapeHtml(
      "auth",
      `notificacao-pos-submit-${attempt + 1}`,
      await page.content().catch(() => "")
    );
  }
}

/**
 * Login no SIGAA usando uma page já aberta.
 * Após retornar, a page está logada e pronta para navegar.
 * NÃO abre nem fecha browser/context — quem chama gerencia o lifecycle.
 */
export async function loginSigaaOnPage(
  page: Page,
  credentials: SigaaCredentials
): Promise<void> {
  try {
    await page.goto(SIGAA_LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: SIGAA_LOGIN_TIMEOUT_MS,
    });
  } catch (error) {
    throw ScraperError.timeout(
      "O SIGAA demorou para abrir a tela de login. Aguarde um minuto e tente de novo."
    );
  }

  try {
    await fillLoginForm(page, credentials);
    await submitLoginForm(page);
    await page.waitForLoadState("domcontentloaded", {
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    });

    if (page.url().includes("verTelaLogin")) {
      await detectLoginFailure(page);
      throw ScraperError.authFailed("Login não concluído no SIGAA.");
    }

    await dismissPendingNotifications(page, credentials);
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw mapUnknownScraperError(error);
  }
}

/**
 * Wrapper de compatibilidade — modo mock retorna SigaaSession com cookies vazios.
 * Modo live não é mais chamado aqui (usa loginSigaaOnPage diretamente).
 */
export function createMockSession(credentials: SigaaCredentials): SigaaSession {
  if (credentials.password === "erro") {
    throw ScraperError.invalidCredentials();
  }

  if (credentials.username.toLowerCase() === "offline") {
    throw ScraperError.offline();
  }

  return {
    username: credentials.username,
    cookies: [],
    loggedInAt: new Date().toISOString(),
  };
}

/** @deprecated — Use loginSigaaOnPage para modo live. Mantido para mock. */
export async function loginSigaa(
  credentials: SigaaCredentials
): Promise<SigaaSession> {
  if (SIGAA_SCRAPER_MOCK) {
    return createMockSession(credentials);
  }

  throw new Error(
    "loginSigaa() não deve ser chamado no modo live. Use loginSigaaOnPage(page, credentials)."
  );
}
