import type { Page } from "playwright";
import {
  SIGAA_LOGIN_TIMEOUT_MS,
  SIGAA_LOGIN_URL,
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_MOCK,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { createSigaaContext, launchSigaaBrowser } from "@/lib/scraper/browser";
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

async function assertPortalAccessible(page: Page): Promise<void> {
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });

  const currentUrl = page.url();
  if (currentUrl.includes("verTelaLogin")) {
    const body = await page.content();
    if (LOGIN_ERROR_PATTERN.test(body)) {
      throw ScraperError.invalidCredentials();
    }
    throw ScraperError.authFailed("Sessão não autorizada no portal do discente.");
  }
}

async function detectLoginFailure(page: Page): Promise<void> {
  const body = await page.content();
  if (LOGIN_ERROR_PATTERN.test(body)) {
    throw ScraperError.invalidCredentials();
  }
}

function createMockSession(credentials: SigaaCredentials): SigaaSession {
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

export async function loginSigaa(
  credentials: SigaaCredentials
): Promise<SigaaSession> {
  if (SIGAA_SCRAPER_MOCK) {
    return createMockSession(credentials);
  }

  const browser = await launchSigaaBrowser();

  try {
    const context = await createSigaaContext(browser);
    const page = await context.newPage();

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

      await assertPortalAccessible(page);

      const cookies = await context.cookies();
      return {
        username: credentials.username,
        cookies,
        loggedInAt: new Date().toISOString(),
      };
    } catch (error) {
      throw mapUnknownScraperError(error);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
