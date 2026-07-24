import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("1/3 Iniciando Worker local do SIGAA...");
const workerProc = spawn("npm", ["run", "worker:home"], {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});

console.log("2/3 Abrindo túnel Cloudflare...");
const tunnelProc = spawn("npx", ["-y", "cloudflared", "tunnel", "--url", "http://127.0.0.1:8787"], {
  cwd: appRoot,
  stdio: ["ignore", "pipe", "pipe"],
});

let updatedSecret = false;

function handleLine(line) {
  console.log(`[túnel] ${line}`);
  const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !updatedSecret) {
    const tunnelUrl = match[0];
    updatedSecret = true;
    console.log(`\n✨ URL do Túnel gerada: ${tunnelUrl}`);
    console.log("3/3 Atualizando secret SIGAA_WORKER_URL no Cloudflare...");

    const wranglerProc = spawn("npx", ["wrangler", "secret", "put", "SIGAA_WORKER_URL"], {
      cwd: appRoot,
      stdio: ["pipe", "inherit", "inherit"],
    });

    wranglerProc.stdin.write(`${tunnelUrl}\n`);
    wranglerProc.stdin.end();

    wranglerProc.on("close", (code) => {
      if (code === 0) {
        console.log("\n=======================================================");
        console.log("🚀 WORKER CONECTADO COM SUCESSO AO APP DA NUVEM!");
        console.log(`URL do worker: ${tunnelUrl}`);
        console.log("Pressione Ctrl+C para encerrar quando terminar.");
        console.log("=======================================================\n");
      }
    });
  }
}

tunnelProc.stdout.on("data", (data) => {
  data.toString().split("\n").forEach((line) => line.trim() && handleLine(line));
});

tunnelProc.stderr.on("data", (data) => {
  data.toString().split("\n").forEach((line) => line.trim() && handleLine(line));
});

process.on("SIGINT", () => {
  console.log("\nEncerrando worker e túnel local...");
  workerProc.kill();
  tunnelProc.kill();
  process.exit(0);
});
