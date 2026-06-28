import type { Page } from "playwright";
import { createSigaaContext, launchSigaaBrowser } from "@/lib/scraper/browser";
import type { SigaaSession } from "@/lib/scraper/types";

export async function withAuthenticatedPage<T>(
  session: SigaaSession,
  callback: (page: Page) => Promise<T>
): Promise<T> {
  const browser = await launchSigaaBrowser();

  try {
    const context = await createSigaaContext(browser);

    if (session.cookies.length > 0) {
      await context.addCookies(session.cookies);
    }

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
