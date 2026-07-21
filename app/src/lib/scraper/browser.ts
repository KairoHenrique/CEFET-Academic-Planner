import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  SIGAA_BROWSER_CHANNEL,
  SIGAA_HEADLESS,
  SIGAA_BROWSER_EXECUTABLE_PATH,
} from "@/lib/scraper/constants";

export async function launchSigaaBrowser(): Promise<Browser> {
  const args = ["--no-sandbox", "--disable-dev-shm-usage"];

  // Termux/ARM: Use explicit executable path if provided.
  if (SIGAA_BROWSER_EXECUTABLE_PATH) {
    return chromium.launch({
      executablePath: SIGAA_BROWSER_EXECUTABLE_PATH,
      headless: SIGAA_HEADLESS,
      args,
    });
  }

  // PC home-worker: Chrome/Edge instalados do sistema (SIGAA_BROWSER_CHANNEL).
  // Container/Fly: omitir a var → Chromium embutido do Playwright.
  if (SIGAA_BROWSER_CHANNEL) {
    return chromium.launch({
      channel: SIGAA_BROWSER_CHANNEL,
      headless: SIGAA_HEADLESS,
      args,
    });
  }

  return chromium.launch({
    headless: SIGAA_HEADLESS,
    args,
  });
}

export async function createSigaaContext(
  browser: Browser
): Promise<BrowserContext> {
  const context = await browser.newContext({
    locale: "pt-BR",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });

  // Rodando via tsx/esbuild (worker B54, scripts B72), o bundler injeta o
  // helper `__name` nas funções serializadas ao page.evaluate — que não
  // existe no browser. Shim no-op restaura compatibilidade.
  await context.addInitScript(
    "globalThis.__name = globalThis.__name || ((fn) => fn);"
  );

  return context;
}
