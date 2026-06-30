import fs from "node:fs";
import path from "node:path";

export const SIGAA_BASE_URL = "https://sig.cefetmg.br/sigaa/";

export const SIGAA_LOGIN_URL = `${SIGAA_BASE_URL}verTelaLogin.do`;

export const SIGAA_PORTAL_DISCENTE_URL =
  `${SIGAA_BASE_URL}portais/discente/discente.jsf`;

export const SIGAA_TURMA_VIRTUAL_URL = `${SIGAA_BASE_URL}ava/index.jsf`;

export const SIGAA_TURMA_SCRAPE_DELAY_MS = Number(
  process.env.SIGAA_TURMA_SCRAPE_DELAY_MS ?? 250
);

export const SIGAA_LOGIN_TIMEOUT_MS = Number(
  process.env.SIGAA_LOGIN_TIMEOUT_MS ?? 30_000
);

export const SIGAA_NAVIGATION_TIMEOUT_MS = Number(
  process.env.SIGAA_NAVIGATION_TIMEOUT_MS ?? 20_000
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

export const SIGAA_HEADLESS =
  process.env.SIGAA_HEADLESS !== "false" &&
  process.env.SIGAA_HEADLESS !== "0";
