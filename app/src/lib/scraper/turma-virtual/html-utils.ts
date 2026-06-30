const BR_DATE_PATTERN = /(\d{2})\/(\d{2})\/(\d{4})/;

export function stripHtmlTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ");
}

/** Converte fragmento HTML em texto legível preservando quebras de linha e listas. */
export function htmlFragmentToPlainText(html: string): string {
  const decoded = decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const withBreaks = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, "");

  return withBreaks
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractTableRowsFromHtml(html: string): string[][] {
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

export function extractTitleAttributes(html: string): Record<string, string> {
  const titles: Record<string, string> = {};
  const cellPattern = /<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi;
  let match = cellPattern.exec(html);

  while (match) {
    const attrs = match[1] ?? "";
    const titleMatch = attrs.match(/\btitle=["']([^"']*)["']/i);
    if (!titleMatch) {
      match = cellPattern.exec(html);
      continue;
    }

    const label = stripHtmlTags(match[2] ?? "");
    if (label) {
      titles[label] = titleMatch[1].replace(/&quot;/g, '"').trim();
    }
    match = cellPattern.exec(html);
  }

  return titles;
}

export function extractLinkHrefs(html: string): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match = linkPattern.exec(html);

  while (match) {
    const label = stripHtmlTags(match[2]);
    const href = match[1].replace(/&amp;/g, "&").trim();
    if (label && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      links.push({ label, href });
    }
    match = linkPattern.exec(html);
  }

  return links;
}

export function parseBrDateToIso(date: string): string | null {
  const match = date.match(BR_DATE_PATTERN);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function parseBrDecimal(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (normalized === "-" || normalized === "—") return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function findTableByHeader(
  rows: string[][],
  headerMatchers: RegExp[]
): string[][] | null {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const normalized = row.map(normalizeHeader);
    const matches = headerMatchers.every((matcher) =>
      normalized.some((cell) => matcher.test(cell))
    );
    if (matches) {
      return rows.slice(index);
    }
  }
  return null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
