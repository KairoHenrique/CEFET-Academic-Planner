/**
 * Home-worker no PC: sobe Playwright (:8787) + túnel trycloudflare
 * e atualiza o secret SIGAA_WORKER_URL no Cloudflare (acme-hub).
 *
 * Uso:  cd app && npm run worker:temp
 * Deixe este processo aberto enquanto quiser sync na nuvem.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(appRoot, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`[ports] Encerrado PID ${pid} na porta ${port}`);
        } catch {
          /* already gone */
        }
      }
      return;
    }
    execSync(`fuser -k -9 ${port}/tcp`, { stdio: "ignore" });
  } catch {
    /* porta livre */
  }
}

function waitForLocalHealth(port, timeoutMs = 60_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timeout aguardando /health em :${port}`));
        return;
      }
      setTimeout(tick, 500);
    };
    tick();
  });
}

async function waitForPublicHealth(url, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const body = await res.text();
        if (body.includes('"ok"')) return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Túnel público não respondeu /health: ${url}`);
}

function resolveCloudflaredBin() {
  if (process.platform === "win32") {
    const localWin = path.join(appRoot, "cloudflared.exe");
    if (fs.existsSync(localWin)) return localWin;
    const programFiles = path.join(
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "cloudflared",
      "cloudflared.exe"
    );
    if (fs.existsSync(programFiles)) return programFiles;
    const programFiles64 = path.join(
      process.env.ProgramFiles || "C:\\Program Files",
      "cloudflared",
      "cloudflared.exe"
    );
    if (fs.existsSync(programFiles64)) return programFiles64;
    // Não use o arquivo `cloudflared` sem .exe — costuma ser binário Linux do Termux.
    return "cloudflared";
  }

  const localUnix = path.join(appRoot, "cloudflared");
  if (fs.existsSync(localUnix)) return localUnix;
  return "cloudflared";
}

const fileEnv = loadEnvLocal();
const env = {
  ...process.env,
  ...fileEnv,
  SYNC_MIRROR_POSTGRES: fileEnv.SYNC_MIRROR_POSTGRES ?? "true",
};
if (fileEnv.CLOUDFLARE_API_TOKEN) {
  env.CLOUDFLARE_API_TOKEN = fileEnv.CLOUDFLARE_API_TOKEN;
}

const workerPort = Number(fileEnv.WORKER_PORT || 8787);

console.log("Liberando portas de execuções anteriores...");
killPort(workerPort);
killPort(8788);
await new Promise((r) => setTimeout(r, 800));

console.log(`1/3 Iniciando Worker local do SIGAA (:${workerPort})...`);
const workerProc = spawn(
  process.execPath,
  [
    path.join(appRoot, "node_modules", "tsx", "dist", "cli.mjs"),
    "-C",
    "react-server",
    "--env-file=.env.local",
    path.join(appRoot, "worker", "main.ts"),
  ],
  {
    cwd: appRoot,
    stdio: "inherit",
    env,
  }
);

console.log("2/3 Abrindo túnel Cloudflare...");
const cloudflaredBin = resolveCloudflaredBin();
const tunnelProc = spawn(
  cloudflaredBin,
  ["tunnel", "--url", `http://127.0.0.1:${workerPort}`],
  {
    cwd: appRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env,
  }
);

let updatedSecret = false;
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nEncerrando worker e túnel local...");
  try {
    workerProc.kill();
  } catch {
    /* ignore */
  }
  try {
    tunnelProc.kill();
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

workerProc.on("exit", (code) => {
  if (shuttingDown) return;
  console.error(`[worker] processo saiu com código ${code}`);
  shutdown();
});

tunnelProc.on("exit", (code) => {
  if (shuttingDown) return;
  console.error(`[túnel] cloudflared saiu com código ${code}`);
  shutdown();
});

async function onTunnelUrl(tunnelUrl) {
  if (updatedSecret) return;
  updatedSecret = true;

  console.log(`\n✨ URL do Túnel gerada: ${tunnelUrl}`);
  try {
    console.log("[*] Aguardando health local...");
    await waitForLocalHealth(workerPort);
    console.log("[+] Health local OK");
    console.log("[*] Aguardando health público do túnel...");
    await waitForPublicHealth(tunnelUrl);
    console.log("[+] Health público OK");
  } catch (err) {
    console.error(`[-] ${err instanceof Error ? err.message : err}`);
    console.error("    Secret NÃO foi atualizado (evita 530/1016).");
    shutdown();
    return;
  }

  console.log("3/3 Atualizando secret SIGAA_WORKER_URL no Cloudflare...");
  if (!env.CLOUDFLARE_API_TOKEN) {
    console.error("[-] CLOUDFLARE_API_TOKEN ausente no .env.local");
    shutdown();
    return;
  }

  const wranglerProc = spawn(
    "npx",
    ["wrangler", "secret", "put", "SIGAA_WORKER_URL", "--name", "acme-hub"],
    {
      cwd: appRoot,
      stdio: ["pipe", "inherit", "inherit"],
      env,
      shell: process.platform === "win32",
    }
  );

  wranglerProc.stdin.write(`${tunnelUrl}\n`);
  wranglerProc.stdin.end();

  wranglerProc.on("close", (code) => {
    if (code === 0) {
      // Espelha a URL no .env.local para smoke local (não é lido pela nuvem)
      try {
        let text = fs.readFileSync(envPath, "utf8");
        if (/^SIGAA_WORKER_URL=/m.test(text)) {
          text = text.replace(
            /^SIGAA_WORKER_URL=.*$/m,
            `SIGAA_WORKER_URL=${tunnelUrl}`
          );
        } else {
          text += `\nSIGAA_WORKER_URL=${tunnelUrl}\n`;
        }
        fs.writeFileSync(envPath, text);
      } catch {
        /* optional */
      }

      console.log("\n=======================================================");
      console.log("WORKER CONECTADO AO APP DA NUVEM");
      console.log(`URL: ${tunnelUrl}`);
      console.log("Deixe este terminal ABERTO. Ctrl+C para encerrar.");
      console.log("=======================================================\n");
      return;
    }
    console.error(`[-] wrangler secret put falhou (code ${code})`);
    console.error(`    Rode manualmente: printf '%s' '${tunnelUrl}' | npx wrangler secret put SIGAA_WORKER_URL --name acme-hub`);
  });
}

function handleLine(line) {
  console.log(`[túnel] ${line}`);
  const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    void onTunnelUrl(match[0]);
  }
}

tunnelProc.stdout.on("data", (data) => {
  data
    .toString()
    .split(/\r?\n/)
    .forEach((line) => line.trim() && handleLine(line));
});
tunnelProc.stderr.on("data", (data) => {
  data
    .toString()
    .split(/\r?\n/)
    .forEach((line) => line.trim() && handleLine(line));
});
