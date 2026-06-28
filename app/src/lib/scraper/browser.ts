import { chromium, type Browser, type BrowserContext } from "playwright";
import { SIGAA_HEADLESS } from "@/lib/scraper/constants";

export async function launchSigaaBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: SIGAA_HEADLESS,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

export async function createSigaaContext(
  browser: Browser
): Promise<BrowserContext> {
  return browser.newContext({
    locale: "pt-BR",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });
}
