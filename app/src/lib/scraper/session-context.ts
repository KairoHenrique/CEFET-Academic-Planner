import type { Page } from "playwright";
import { createSigaaContext, launchSigaaBrowser } from "@/lib/scraper/browser";

/**
 * Abre um único browser + context + page e executa o callback.
 * Todo o sync (login → portal → turma → histórico) roda na mesma page,
 * mantendo a sessão JSF do SIGAA intacta.
 */
export async function withSyncBrowser<T>(
  callback: (page: Page) => Promise<T>
): Promise<T> {
  const browser = await launchSigaaBrowser();

  try {
    const context = await createSigaaContext(browser);
    const page = await context.newPage();

    try {
      return await callback(page);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
