import fs from "node:fs";
import path from "node:path";

export {
  SIGAA_BASE_URL,
  SIGAA_LOGIN_URL,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_TURMA_VIRTUAL_URL,
} from "@/lib/scraper/sigaa-urls";

export const SIGAA_TURMA_SCRAPE_DELAY_MS = Number(
  process.env.SIGAA_TURMA_SCRAPE_DELAY_MS ?? 250
);

/** Margem maior (Termux/ARM): login lento no Chromium do pkg. Override: SIGAA_LOGIN_TIMEOUT_MS. */
export const SIGAA_LOGIN_TIMEOUT_MS = Number(
  process.env.SIGAA_LOGIN_TIMEOUT_MS ?? 90_000
);

/**
 * Timeout de navegação/cliques no SIGAA.
 * Motivo: páginas pesadas + rede do tablet. Override: SIGAA_NAVIGATION_TIMEOUT_MS.
 * @see README.md §10
 */
export const SIGAA_NAVIGATION_TIMEOUT_MS = Number(
  process.env.SIGAA_NAVIGATION_TIMEOUT_MS ?? 60_000
);

/** Lê flag do `.env.local` — tem prioridade sobre variável herdada do shell (ex.: npm test). */
function readBooleanFromEnvLocal(key: string): boolean | null {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return null;

    const line = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((entry) => new RegExp(`^\\s*${key}\\s*=`).test(entry));
    if (!line) return null;

    const raw = line.split("=")[1]?.split("#")[0]?.trim().toLowerCase() ?? "";
    if (raw === "false" || raw === "0") return false;
    if (raw === "true" || raw === "1") return true;
    return null;
  } catch {
    return null;
  }
}

function resolveBooleanEnv(key: string, defaultValue = false): boolean {
  const fromLocal = readBooleanFromEnvLocal(key);
  if (fromLocal !== null) return fromLocal;

  const value = process.env[key]?.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return defaultValue;
}

export const SIGAA_SCRAPER_MOCK = resolveBooleanEnv("SIGAA_SCRAPER_MOCK");

export const SIGAA_SCRAPER_DEBUG = resolveBooleanEnv("SIGAA_SCRAPER_DEBUG");

function readStringFromEnvLocal(key: string): string | null {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return null;

    const line = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((entry) => new RegExp(`^\\s*${key}\\s*=`).test(entry));
    if (!line) return null;

    const raw = line.split("=")[1]?.split("#")[0]?.trim() ?? "";
    return raw || null;
  } catch {
    return null;
  }
}

/** Caminho local para PDF de histórico (dev/diagnóstico). */
export const SIGAA_HISTORICO_PDF_PATH =
  readStringFromEnvLocal("SIGAA_HISTORICO_PDF_PATH") ??
  (process.env.SIGAA_HISTORICO_PDF_PATH?.trim() || null);

/** Caminho local para HTML do calendário acadêmico (dev/diagnóstico). */
export const SIGAA_CALENDARIO_HTML_PATH =
  readStringFromEnvLocal("SIGAA_CALENDARIO_HTML_PATH") ??
  (process.env.SIGAA_CALENDARIO_HTML_PATH?.trim() || null);

/** Caminho local para HTML de turmas ofertadas (dev/diagnóstico). */
export const SIGAA_TURMAS_OFERTADAS_HTML_PATH =
  readStringFromEnvLocal("SIGAA_TURMAS_OFERTADAS_HTML_PATH") ??
  (process.env.SIGAA_TURMAS_OFERTADAS_HTML_PATH?.trim() || null);

/** Calendário oficial DIRGRAD (fallback quando menu SIGAA não abre detalhe). */
export const DIRGRAD_CALENDARIO_URL =
  readStringFromEnvLocal("DIRGRAD_CALENDARIO_URL") ??
  (process.env.DIRGRAD_CALENDARIO_URL?.trim() ||
    "https://www.dirgrad.cefetmg.br/dirgrad/calendario/");

export const SIGAA_HEADLESS =
  process.env.SIGAA_HEADLESS !== "false" &&
  process.env.SIGAA_HEADLESS !== "0";

/**
 * Canal do browser do sistema para Playwright (`chrome` | `msedge` | …).
 * Vazio = Chromium embutido (Docker/Fly). No PC home-worker use `chrome`.
 */
export const SIGAA_BROWSER_CHANNEL = (() => {
  const fromLocal = readStringFromEnvLocal("SIGAA_BROWSER_CHANNEL");
  const raw = (fromLocal ?? process.env.SIGAA_BROWSER_CHANNEL?.trim() ?? "")
    .toLowerCase();
  if (raw === "chrome" || raw === "msedge" || raw === "chrome-beta") {
    return raw;
  }
  return null;
})();

/**
 * Caminho absoluto para um executável customizado do Chromium (útil no Termux/Linux ARM).
 */
export const SIGAA_BROWSER_EXECUTABLE_PATH = (() => {
  const fromLocal = readStringFromEnvLocal("SIGAA_BROWSER_EXECUTABLE_PATH");
  const raw = (fromLocal ?? process.env.SIGAA_BROWSER_EXECUTABLE_PATH?.trim() ?? "");
  return raw || null;
})();
