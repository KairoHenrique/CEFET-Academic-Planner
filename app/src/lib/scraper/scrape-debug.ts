import fs from "node:fs";
import path from "node:path";
import {
  getActiveSigaaUsername,
  resolveUserDataDir,
} from "@/lib/db/connection-manager";
import { SIGAA_SCRAPER_DEBUG } from "@/lib/scraper/constants";

function debugDir(): string {
  const dir = path.join(
    resolveUserDataDir(getActiveSigaaUsername()),
    "scrape-debug"
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();
}

/** Salva HTML capturado quando SIGAA_SCRAPER_DEBUG=true. */
export function dumpScrapeHtml(
  disciplina: string,
  section: string,
  html: string | null
): void {
  if (!html) return;

  const filename = `${Date.now()}-${safeSlug(disciplina)}-${safeSlug(section)}.html`;
  fs.writeFileSync(path.join(debugDir(), filename), html, "utf8");
  console.info(`[scraper:debug] HTML salvo: .data/scrape-debug/${filename}`);
}
