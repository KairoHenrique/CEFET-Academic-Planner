import type { Page } from "playwright";
import type { PortalPageRawData } from "@/lib/scraper/types/portal-discente";

function stripHtmlTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTableRowsFromHtml(html: string): string[][] {
  const rows: string[][] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch = rowPattern.exec(html);

  while (rowMatch) {
    const cells: string[] = [];
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch = cellPattern.exec(rowMatch[1]);

    while (cellMatch) {
      cells.push(stripHtmlTags(cellMatch[1]));
      cellMatch = cellPattern.exec(rowMatch[1]);
    }

    if (cells.length > 0) {
      rows.push(cells);
    }

    rowMatch = rowPattern.exec(html);
  }

  return rows;
}

function buildLabelPairs(rows: string[][]): Record<string, string> {
  const pairs: Record<string, string> = {};

  for (const row of rows) {
    if (row.length < 2) continue;
    const label = row[0]?.trim();
    const value = row.slice(1).join(" ").trim();
    if (label && value) {
      pairs[label] = value;
    }
  }

  return pairs;
}

export function extractPortalRawFromHtml(html: string): PortalPageRawData {
  const tableRows = extractTableRowsFromHtml(html);
  return {
    labelPairs: buildLabelPairs(tableRows),
    tableRows,
    plainText: stripHtmlTags(html),
  };
}

export async function extractPortalRawFromPage(page: Page): Promise<PortalPageRawData> {
  return page.evaluate(() => {
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
