#!/usr/bin/env node
/**
 * Injeta vars públicas de app/.env.local em app/wrangler.jsonc antes do deploy:cf.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(APP_ROOT, ".env.local");
const WRANGLER_PATH = resolve(APP_ROOT, "wrangler.jsonc");

const PUBLIC_VAR_KEYS = [
  "PLANNER_DATABASE",
  "PLANNER_CLOUD",
  "PLANNER_CURSO_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

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

function stripJsonComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const env = parseEnvFile(ENV_PATH);
const vars = {};

for (const key of PUBLIC_VAR_KEYS) {
  const value = env[key]?.trim();
  if (value) {
    vars[key] = value;
  }
}

if (Object.keys(vars).length === 0) {
  console.warn("[inject-wrangler-vars] nenhuma var pública em .env.local — skip");
  process.exit(0);
}

vars.PLANNER_CLOUD ??= "true";
vars.PLANNER_CURSO_ID ??= "eng-computacao";
vars.PLANNER_DATABASE ??= "postgres";

const raw = readFileSync(WRANGLER_PATH, "utf8");
const config = JSON.parse(stripJsonComments(raw));
config.vars = vars;
writeFileSync(WRANGLER_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `[inject-wrangler-vars] vars aplicadas: ${Object.keys(vars).join(", ")}`
);
