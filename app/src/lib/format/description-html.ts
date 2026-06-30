const URL_PATTERN = /^https?:\/\/\S+$/i;
export const URL_INLINE_PATTERN = /(https?:\/\/[^\s<]+)/g;
const BULLET_PATTERN = /^[-•*]\s+/;
const NUMBERED_SECTION_PATTERN = /^\d+\)\s+/;
const TRUSTED_FORMATTED_HTML =
  /<(?:p|ul)\s+class="desc-(?:heading|list|link)"/i;
const BLOCKS_CACHE_MAX = 48;

export type DescriptionBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "list"; items: string[] };

const descriptionBlocksCache = new Map<string, DescriptionBlock[]>();
const preparedHtmlCache = new Map<string, string>();

function cacheBlocks(source: string, blocks: DescriptionBlock[]): DescriptionBlock[] {
  if (descriptionBlocksCache.size >= BLOCKS_CACHE_MAX) {
    const oldest = descriptionBlocksCache.keys().next().value;
    if (oldest) descriptionBlocksCache.delete(oldest);
  }
  descriptionBlocksCache.set(source, blocks);
  return blocks;
}

function cachePreparedHtml(source: string, result: string): string {
  if (preparedHtmlCache.size >= BLOCKS_CACHE_MAX) {
    const oldest = preparedHtmlCache.keys().next().value;
    if (oldest) preparedHtmlCache.delete(oldest);
  }
  preparedHtmlCache.set(source, result);
  return result;
}

function isTrustedFormattedHtml(source: string): boolean {
  return TRUSTED_FORMATTED_HTML.test(source);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ");
}

function decodeInlineHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextBlocks(source: string): string[] {
  const decoded = decodeHtmlEntities(source)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const normalized = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  return normalized
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function textLinesToBlocks(lines: string[]): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push({ kind: "list", items: [...bulletBuffer] });
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (BULLET_PATTERN.test(line)) {
      bulletBuffer.push(line.replace(BULLET_PATTERN, ""));
      continue;
    }

    flushBullets();

    if (NUMBERED_SECTION_PATTERN.test(line)) {
      blocks.push({ kind: "heading", text: line });
      continue;
    }

    if (URL_PATTERN.test(line)) {
      blocks.push({ kind: "link", href: line, text: line });
      continue;
    }

    blocks.push({ kind: "paragraph", text: line });
  }

  flushBullets();
  return blocks;
}

function parseTrustedHtmlToBlocks(html: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  const tokenPattern =
    /<p class="desc-heading">([\s\S]*?)<\/p>|<ul class="desc-list">([\s\S]*?)<\/ul>|<p class="desc-link"><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/p>|<p>([\s\S]*?)<\/p>/gi;

  let match = tokenPattern.exec(html);
  while (match) {
    if (match[1]) {
      blocks.push({ kind: "heading", text: decodeInlineHtml(match[1]) });
    } else if (match[2]) {
      const items = Array.from(match[2].matchAll(/<li>([\s\S]*?)<\/li>/gi))
        .map((item) => decodeInlineHtml(item[1] ?? ""))
        .filter(Boolean);
      if (items.length > 0) blocks.push({ kind: "list", items });
    } else if (match[3]) {
      blocks.push({
        kind: "link",
        href: match[3],
        text: decodeInlineHtml(match[4] ?? match[3]),
      });
    } else if (match[5]) {
      const text = decodeInlineHtml(match[5]);
      if (text) blocks.push({ kind: "paragraph", text });
    }
    match = tokenPattern.exec(html);
  }

  return blocks;
}

function blocksToRichHtml(blocks: DescriptionBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "heading") {
        return `<p class="desc-heading">${escapeHtml(block.text)}</p>`;
      }
      if (block.kind === "link") {
        const href = escapeAttr(block.href);
        return `<p class="desc-link"><a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(block.text)}</a></p>`;
      }
      if (block.kind === "list") {
        return `<ul class="desc-list">${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${escapeHtml(block.text).replace(URL_INLINE_PATTERN, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</p>`;
    })
    .join("");
}

/** Blocos estruturados para renderização React (sem innerHTML). */
export function getDescriptionBlocks(
  source: string | null | undefined
): DescriptionBlock[] {
  if (!source?.trim()) return [];

  const cached = descriptionBlocksCache.get(source);
  if (cached) return cached;

  let blocks: DescriptionBlock[];
  if (isTrustedFormattedHtml(source)) {
    blocks = parseTrustedHtmlToBlocks(source);
  } else if (/<[a-z][\s\S]*>/i.test(source)) {
    blocks = textLinesToBlocks(extractTextBlocks(source));
  } else {
    blocks = textLinesToBlocks(
      source
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter(Boolean)
    );
  }

  return cacheBlocks(source, blocks);
}

/** Converte HTML cru do SIGAA em HTML semântico para exibição. */
export function formatSigaaDescriptionHtml(source: string): string {
  const blocks = textLinesToBlocks(extractTextBlocks(source));
  if (blocks.length === 0) return "";
  return blocksToRichHtml(blocks);
}

/** Reformata descrição em texto puro (legado) para HTML legível. */
export function formatPlainDescriptionToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isTrustedFormattedHtml(trimmed)) return trimmed;
  return blocksToRichHtml(getDescriptionBlocks(trimmed));
}

/** Remove tags e atributos perigosos; mantém marcação básica. */
export function sanitizeRichHtml(html: string): string {
  const withoutDangerous = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  return withoutDangerous.replace(
    /<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi,
    (_match, tagName: string, attrs: string, offset: number, full: string) => {
      const tag = tagName.toLowerCase();
      const isClosing = full[offset + 1] === "/";

      if (tag === "br") return "<br>";
      if (!["p", "ul", "ol", "li", "a", "b", "strong", "em", "i", "span"].includes(tag)) {
        return "";
      }

      if (isClosing) return `</${tag}>`;

      if (tag === "a") {
        const href = attrs.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
        if (!href || !/^https?:\/\//i.test(href)) return "";
        return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
      }

      if (tag === "p") {
        if (/class\s*=\s*["'][^"']*desc-heading/i.test(attrs)) {
          return '<p class="desc-heading">';
        }
        if (/class\s*=\s*["'][^"']*desc-link/i.test(attrs)) {
          return '<p class="desc-link">';
        }
        return "<p>";
      }

      if (tag === "ul" && /class\s*=\s*["'][^"']*desc-list/i.test(attrs)) {
        return '<ul class="desc-list">';
      }

      return `<${tag}>`;
    }
  );
}

export function prepareDescriptionHtml(source: string | null | undefined): string {
  if (!source?.trim()) return "";

  const cached = preparedHtmlCache.get(source);
  if (cached !== undefined) return cached;

  let result: string;
  if (isTrustedFormattedHtml(source)) {
    result = source;
  } else if (/<[a-z][\s\S]*>/i.test(source)) {
    result = sanitizeRichHtml(source);
  } else {
    result = blocksToRichHtml(getDescriptionBlocks(source));
  }

  return cachePreparedHtml(source, result);
}
