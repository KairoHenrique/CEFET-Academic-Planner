import type { Page, Frame } from "playwright";
import type { PortalPageRawData } from "@/lib/scraper/types/portal-discente";

export { extractPortalRawFromHtml } from "@/lib/scraper/portal-discente/extract-portal-raw-html";

/**
 * Extrai dados raw da página. Se a página principal não contiver muitas linhas
 * (ex: portal usando iframes JSF), procura em todos os frames da página.
 */
export async function extractPortalRawFromPage(page: Page): Promise<PortalPageRawData> {
  const combinedData: PortalPageRawData = {
    labelPairs: {},
    tableRows: [],
    plainText: "",
  };

  const frames = page.frames();
  for (const frame of frames) {
    try {
      const frameData = await evaluateFrame(frame);
      Object.assign(combinedData.labelPairs, frameData.labelPairs);
      combinedData.tableRows.push(...frameData.tableRows);
      combinedData.plainText += "\n" + frameData.plainText;
    } catch {
      // Ignorar erros de cross-origin ou inacessíveis
    }
  }

  return combinedData;
}

async function evaluateFrame(frame: Frame | Page): Promise<PortalPageRawData> {
  return frame.evaluate(() => {
    const tableRows = Array.from(document.querySelectorAll("tr"))
      .map((row) =>
        Array.from(row.querySelectorAll("td, th"))
          .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
          .filter(Boolean)
      )
      .filter((row) => row.length > 0);

    const labelPairs: Record<string, string> = {};
    for (const row of tableRows) {
      if (row.length < 2) continue;
      labelPairs[row[0]] = row.slice(1).join(" ").trim();
    }

    return {
      labelPairs,
      tableRows,
      plainText: document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "",
    };
  });
}
