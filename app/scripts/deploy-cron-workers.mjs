#!/usr/bin/env node
/**
 * Lê CRON_SECRET e URL pública de app/.env.local e faz deploy dos workers cron.
 * Uso: node scripts/deploy-cron-workers.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(APP_ROOT, ".env.local");

function parseEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Arquivo não encontrado: ${path}`);
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function runWrangler(args, stdin) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    cwd: APP_ROOT,
    input: stdin,
    stdio: ["pipe", "inherit", "inherit"],
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`wrangler ${args.join(" ")} falhou (exit ${result.status})`);
  }
}

function putSecret(name, value, config) {
  if (!value?.trim()) {
    throw new Error(`${name} ausente em .env.local`);
  }
  console.log(`→ secret ${name} (${config})`);
  runWrangler(["secret", "put", name, "--config", config], value.trim());
}

function deploy(config) {
  console.log(`→ deploy ${config}`);
  runWrangler(["deploy", "--config", config], undefined);
}

const env = parseEnvFile(ENV_PATH);
const cronSecret = env.CRON_SECRET;
const appUrl =
  env.PLANNER_APP_URL?.trim() ||
  env.PLANNER_HEALTH_URL?.trim() ||
  "https://acme-hub.khfm.workers.dev";

if (!cronSecret?.trim()) {
  throw new Error("CRON_SECRET ausente em app/.env.local");
}

console.log(`App URL: ${appUrl}`);

const pingConfig = "workers/cron-ping/wrangler.jsonc";
const emailsConfig = "workers/cron-account-emails/wrangler.jsonc";

putSecret("CRON_SECRET", cronSecret, pingConfig);
putSecret("PLANNER_HEALTH_URL", appUrl, pingConfig);
deploy(pingConfig);

putSecret("CRON_SECRET", cronSecret, emailsConfig);
putSecret("PLANNER_APP_URL", appUrl, emailsConfig);
deploy(emailsConfig);

console.log("Cron workers deployados.");
