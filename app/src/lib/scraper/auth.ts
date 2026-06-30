import type { Page } from "playwright";
import {
  SIGAA_LOGIN_TIMEOUT_MS,
  SIGAA_LOGIN_URL,
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_SCRAPER_MOCK,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
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

  await usernameField.waitFor({ state: "visible", timeout: 10_000 });
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
    throw mapUnknownScraperError(error);
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
