/**
 * Gera app/.env.termux.local a partir do app/.env.local do PC,
 * com overrides do Chromium/Termux e flags de home-worker.
 *
 * Uso (no PC):  cd app && node scripts/termux-export-env-from-pc.mjs
 * No tablet:   copie .env.termux.local → .env.local  (ou rode termux-fix-env.sh)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(appRoot, ".env.local");
const outPath = path.join(appRoot, ".env.termux.local");

const TERMUX_OVERRIDES = {
  // Playwright no Termux usa Chromium do pkg, não channel=chrome do Windows.
  SIGAA_BROWSER_CHANNEL: "",
  SIGAA_BROWSER_EXECUTABLE_PATH:
    "/data/data/com.termux/files/usr/bin/chromium-browser",
  SIGAA_HEADLESS: "true",
  // Margens maiores — Chromium ARM/Termux é mais lento que PC.
  SIGAA_LOGIN_TIMEOUT_MS: "90000",
  SIGAA_NAVIGATION_TIMEOUT_MS: "60000",
  SIGAA_WORKER_JOB_TIMEOUT_MS: "900000",
  SIGAA_WORKER_SHUTDOWN_MS: "1080000",
  WORKER_PORT: "8787",
  SYNC_MIRROR_POSTGRES: "true",
  PLANNER_DATABASE: "postgres",
  PLANNER_CLOUD: "true",
  ACCOUNT_EMAIL_VIA_HOME_WORKER: "true",
  PLANNER_HEALTH_URL: "https://acme-hub.khfm.workers.dev",
  PLANNER_APP_URL: "https://acme-hub.khfm.workers.dev",
};

const REQUIRED_KEYS = [
  "CREDENTIALS_ENCRYPTION_KEY",
  "WORKER_SHARED_SECRET",
  "DATABASE_URL",
  "SYNC_MIRROR_POSTGRES",
  "CLOUDFLARE_API_TOKEN",
  "CRON_SECRET",
  "GMAIL_SMTP_USER",
  "GMAIL_SMTP_APP_PASSWORD",
];

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function serializeEnv(map) {
  const lines = [
    "# Gerado por scripts/termux-export-env-from-pc.mjs — NÃO commitar",
    "# Paridade com o .env.local do PC + overrides Termux (Chromium).",
    "",
  ];
  const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    const value = map[key] ?? "";
    const needsQuote = /[\s#]/.test(value) || value.includes("=");
    lines.push(needsQuote ? `${key}="${value}"` : `${key}=${value}`);
  }
  lines.push("");
  return lines.join("\n");
}

if (!fs.existsSync(srcPath)) {
  console.error(`[-] Não achei ${srcPath}`);
  process.exit(1);
}

const merged = {
  ...parseEnv(fs.readFileSync(srcPath, "utf8")),
  ...TERMUX_OVERRIDES,
};

// Túnel do PC não serve no Termux — o script regenera ao subir.
delete merged.SIGAA_WORKER_URL;

const missing = REQUIRED_KEYS.filter((k) => !String(merged[k] ?? "").trim());
if (missing.length) {
  console.error(`[-] Faltam chaves obrigatórias no .env.local do PC: ${missing.join(", ")}`);
  process.exit(1);
}

fs.writeFileSync(outPath, serializeEnv(merged), "utf8");
console.log(`[+] Escrito ${outPath}`);
console.log("[*] Overrides Termux:");
for (const [k, v] of Object.entries(TERMUX_OVERRIDES)) {
  console.log(`    ${k}=${v || "(vazio)"}`);
}
console.log("");
console.log("No Termux:");
console.log("  cp .env.termux.local .env.local");
console.log("  bash scripts/termux-servidor-acme.sh");
