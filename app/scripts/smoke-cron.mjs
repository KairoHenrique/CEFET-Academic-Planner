#!/usr/bin/env node
/**
 * Smoke dos endpoints protegidos por CRON_SECRET.
 * Uso: node scripts/smoke-cron.mjs
 * Lê app/.env.local (CRON_SECRET, PLANNER_APP_URL ou PLANNER_HEALTH_URL).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.local");

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

const env = parseEnvFile(ENV_PATH);
const secret = process.argv[2]?.trim() || env.CRON_SECRET?.trim();
const base = (
  process.argv[3]?.trim() ||
  env.PLANNER_APP_URL?.trim() ||
  env.PLANNER_HEALTH_URL?.trim() ||
  "https://acmehub.com.br"
).replace(/\/$/, "");

if (!secret) {
  console.error(
    "CRON_SECRET ausente. Defina em app/.env.local ou passe: node scripts/smoke-cron.mjs <CRON_SECRET>"
  );
  process.exit(1);
}

console.log(`Base: ${base}`);

async function hit(path, method = "GET") {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  console.log(`${method} ${path} -> ${res.status}${isJson ? "" : " (HTML — worker crash?)"}`);
  console.log(text.slice(0, 400));
  return res.ok && isJson;
}

const emailsOk = await hit("/api/cron/account-emails", "POST");
const healthOk = await hit("/api/health");
process.exit(emailsOk && healthOk ? 0 : 1);
