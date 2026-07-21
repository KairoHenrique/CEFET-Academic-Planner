/**
 * Sobe o worker Playwright neste PC (home server).
 * Carrega app/.env.local — exige DATABASE_URL, SYNC_MIRROR_POSTGRES,
 * WORKER_SHARED_SECRET, CREDENTIALS_ENCRYPTION_KEY.
 *
 * Em outro terminal: npm run worker:tunnel  (cloudflared → :8787)
 * Depois: npx wrangler secret put SIGAA_WORKER_URL  (URL do tunnel)
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(appRoot, "node_modules", "tsx", "dist", "cli.mjs");
const main = path.join(appRoot, "worker", "main.ts");

const preload = path.join(appRoot, "worker", "termux-preload.cjs");

const child = spawn(
  process.execPath,
  [tsxCli, "-C", "react-server", "--env-file=.env.local", "--require", preload, main],
  {
    cwd: appRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      SYNC_MIRROR_POSTGRES: process.env.SYNC_MIRROR_POSTGRES ?? "true",
    },
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
