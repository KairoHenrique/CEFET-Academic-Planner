// B72e — Smoke end-to-end do sync na URL pública (ou local simulando cloud).
//
// Fluxo: [worker /health] → POST /api/sync/queue → polling /api/sync/queue/:id
// até completed/failed → resumo dos steps.
//
// Uso (PowerShell):
//   $env:PLANNER_APP_URL="https://acme-hub.khfm.workers.dev"
//   $env:SIGAA_CPF="..."; $env:SIGAA_PASSWORD="..."   # senha opcional se salva na conta
//   $env:SIGAA_WORKER_URL="https://..." (opcional — health direto do worker)
//   node scripts/smoke-cloud-sync.mjs

const appUrl = (process.env.PLANNER_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const workerUrl = process.env.SIGAA_WORKER_URL?.replace(/\/$/, "");
const cpf = process.env.SIGAA_CPF?.trim();
const password = process.env.SIGAA_PASSWORD;
const mode = process.env.SIGAA_SYNC_MODE ?? "full";
const pollTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 480_000);

if (!cpf) {
  console.error("Defina SIGAA_CPF (e opcionalmente SIGAA_PASSWORD).");
  process.exit(1);
}

function log(step, detail) {
  console.log(`[smoke] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function checkWorkerHealth() {
  if (!workerUrl) return;
  const response = await fetch(`${workerUrl}/health`);
  const body = await response.json();
  if (!response.ok || body?.ok !== true) {
    throw new Error(`Worker /health falhou: HTTP ${response.status}`);
  }
  log("worker /health", "ok");
}

async function enqueue() {
  const response = await fetch(`${appUrl}/api/sync/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Planner-Sigaa-User": cpf,
    },
    body: JSON.stringify({
      username: cpf,
      password: password || undefined,
      mode,
      trigger: "manual",
      lane: "normal",
    }),
  });

  const body = await response.json();
  if (!response.ok || body?.ok !== true) {
    throw new Error(
      `Enqueue falhou: HTTP ${response.status} — ${body?.message ?? JSON.stringify(body).slice(0, 200)}`
    );
  }

  if (body.stub) {
    throw new Error(
      "Rota ainda em stub — SIGAA_WORKER_URL/WORKER_SHARED_SECRET não configurados no app."
    );
  }

  log("enqueue", `job=${body.job.jobId} reused=${body.reused} status=${body.job.status}`);
  return body.job.jobId;
}

async function pollUntilDone(jobId) {
  const deadline = Date.now() + pollTimeoutMs;
  let lastStatus = "";

  while (Date.now() < deadline) {
    const response = await fetch(
      `${appUrl}/api/sync/queue/${encodeURIComponent(jobId)}`,
      { headers: { "X-Planner-Sigaa-User": cpf } }
    );
    const body = await response.json();
    if (!response.ok || body?.ok !== true) {
      throw new Error(`Polling falhou: HTTP ${response.status}`);
    }

    const job = body.job;
    if (job.status !== lastStatus) {
      lastStatus = job.status;
      log("status", `${job.status}${job.position ? ` (posição ${job.position})` : ""}`);
    }

    if (job.status === "completed") return job;
    if (job.status === "failed") {
      throw new Error(
        `Job falhou: ${job.error?.code ?? "?"} — ${job.error?.message ?? "sem detalhe"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Timeout de ${Math.round(pollTimeoutMs / 1000)}s aguardando o job.`);
}

try {
  log("app", appUrl);
  await checkWorkerHealth();

  const jobId = await enqueue();
  const job = await pollUntilDone(jobId);

  const steps = job.result?.steps ?? [];
  log("completed", `${steps.length} etapas${job.result?.partial ? " (parcial)" : ""}`);
  for (const step of steps) {
    console.log(`  · ${step.label} (${step.progress}%)`);
  }
  console.log("[smoke] OK — sync end-to-end concluído.");
} catch (error) {
  console.error(`[smoke] FALHOU: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
