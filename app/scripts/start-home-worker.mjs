/**
 * Sobe o worker Playwright neste PC (home server).
 * Carrega app/.env.local — exige DATABASE_URL, SYNC_MIRROR_POSTGRES,
 * WORKER_SHARED_SECRET, CREDENTIALS_ENCRYPTION_KEY.
 *
 * Em outro terminal: npm run worker:tunnel  (cloudflared → :8787)
 * Depois: npx wrangler secret put SIGAA_WORKER_URL  (URL do tunnel)
 *
 * No Termux: aplica termux-preload.cjs (finge platform=linux).
 * No Windows/macOS: NÃO aplica o preload — senão o Playwright procura
 * Chrome em /opt/google/chrome (Linux) e quebra o channel=chrome.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(appRoot, "node_modules", "tsx", "dist", "cli.mjs");
const main = path.join(appRoot, "worker", "main.ts");
const preload = path.join(appRoot, "worker", "termux-preload.cjs");

const isTermux =
  Boolean(process.env.TERMUX_VERSION) ||
  Boolean(process.env.PREFIX?.includes("com.termux")) ||
  process.platform === "android";

const nodeArgs = [tsxCli, "-C", "react-server", "--env-file=.env.local"];
if (isTermux) {
  nodeArgs.push("--require", preload);
}
nodeArgs.push(main);

const child = spawn(process.execPath, nodeArgs, {
  cwd: appRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    SYNC_MIRROR_POSTGRES: process.env.SYNC_MIRROR_POSTGRES ?? "true",
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
