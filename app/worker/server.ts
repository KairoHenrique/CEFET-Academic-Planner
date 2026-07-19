import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiError } from "@/lib/api/errors";
import {
  resolveGmailSmtpConfig,
  sendViaGmailSmtp,
} from "@/lib/email/gmail-smtp-send";
import { BrowserJobSlot } from "@/lib/worker/browser-job-slot";
import { loadWorkerConfig, type WorkerConfig } from "@/lib/worker/config";
import type { WorkerJobResult, WorkerStatusResponse } from "@/lib/worker/job-types";
import { parseWorkerEmailSendRequest } from "@/lib/worker/parse-email-send-request";
import {
  assertAsyncExecutionAvailable,
  startWorkerAsyncJob,
} from "@/lib/worker/run-async-job";
import { runWorkerSyncJob } from "@/lib/worker/run-sync-job";
import { parseWorkerJobRequest } from "@/lib/worker/validate-job-request";
import { WorkerRuntimeState } from "@/lib/worker/worker-runtime-state";

// Rate Limiting: 30 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const rateLimiter = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  if (!ip) return true; // Se não conseguir identificar, deixa passar (evitar block global)
  
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (!record || now > record.expiresAt) {
    rateLimiter.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

// Limpeza periodica do Map para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimiter.entries()) {
    if (now > record.expiresAt) {
      rateLimiter.delete(ip);
    }
  }
}, 60_000).unref();

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });

    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new ApiError("VALIDATION_ERROR", "JSON inválido.", 400));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function isAuthorized(
  request: IncomingMessage,
  config: WorkerConfig
): boolean {
  const header = request.headers.authorization?.trim() ?? "";
  const expected = `Bearer ${config.sharedSecret}`;
  return header.length === expected.length && header === expected;
}

function buildStatus(
  runtime: WorkerRuntimeState,
  slot: BrowserJobSlot
): WorkerStatusResponse {
  const snapshot = slot.snapshot();
  return {
    ok: true,
    busy: runtime.isBusy(),
    uptimeMs: runtime.getUptimeMs(),
    acceptingJobs: runtime.canAcceptJobs(),
    currentJobId: runtime.getCurrentJobId(),
    slot: {
      maxConcurrent: snapshot.maxConcurrent,
      activeSlots: snapshot.activeSlots,
      queued: snapshot.queued,
    },
  };
}

export function createWorkerServer(options?: {
  config?: WorkerConfig;
  slot?: BrowserJobSlot;
  runtime?: WorkerRuntimeState;
}): {
  server: http.Server;
  config: WorkerConfig;
  slot: BrowserJobSlot;
  runtime: WorkerRuntimeState;
} {
  const config = options?.config ?? loadWorkerConfig();
  const slot =
    options?.slot ?? new BrowserJobSlot(config.maxConcurrent);
  const runtime = options?.runtime ?? new WorkerRuntimeState();

  const server = http.createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://localhost");
    
    // Captura do IP via CF-Connecting-IP (Cloudflare) ou X-Forwarded-For
    const clientIp = (request.headers["cf-connecting-ip"] as string) 
                  || (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() 
                  || request.socket.remoteAddress 
                  || "unknown";

    try {
      // Aplicar Rate Limit globalmente para qualquer request (menos health)
      if (url.pathname !== "/health" && !checkRateLimit(clientIp)) {
        sendJson(response, 429, {
          ok: false,
          code: "TOO_MANY_REQUESTS",
          message: "Limite de requisições excedido. Tente novamente mais tarde.",
        });
        return;
      }
      if (method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { ok: true, service: "sigaa-worker" });
        return;
      }

      if (method === "GET" && url.pathname === "/status") {
        sendJson(response, 200, buildStatus(runtime, slot));
        return;
      }

      if (method === "POST" && url.pathname === "/email/send") {
        if (!isAuthorized(request, config)) {
          sendJson(response, 401, {
            ok: false,
            code: "UNAUTHORIZED",
            message: "Credencial do worker inválida.",
          });
          return;
        }

        const gmail = resolveGmailSmtpConfig();
        if (!gmail) {
          sendJson(response, 503, {
            ok: false,
            code: "GMAIL_SMTP_NOT_CONFIGURED",
            message:
              "Configure GMAIL_SMTP_USER e GMAIL_SMTP_APP_PASSWORD no .env.local do PC.",
          });
          return;
        }

        const emailRequest = parseWorkerEmailSendRequest(
          await readJsonBody(request)
        );
        const result = await sendViaGmailSmtp(gmail, emailRequest);
        if (!result.ok) {
          sendJson(response, result.retryable === false ? 400 : 502, {
            ok: false,
            code: "GMAIL_SMTP_SEND_FAILED",
            message: result.error ?? "Falha ao enviar.",
          });
          return;
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      if (method === "POST" && url.pathname === "/jobs") {
        if (!runtime.canAcceptJobs()) {
          sendJson(response, 503, {
            ok: false,
            code: "WORKER_SHUTTING_DOWN",
            message: "Worker em graceful shutdown — não aceita novos jobs.",
          });
          return;
        }

        if (!isAuthorized(request, config)) {
          sendJson(response, 401, {
            ok: false,
            code: "UNAUTHORIZED",
            message: "Credencial do worker inválida.",
          });
          return;
        }

        const body = await readJsonBody(request);
        const jobRequest = parseWorkerJobRequest(body);

        // B72e — dispatch cloud: 202 imediato, status vai para a fila Postgres.
        if (jobRequest.execution === "async") {
          assertAsyncExecutionAvailable();
          startWorkerAsyncJob(jobRequest, slot, runtime, config.jobTimeoutMs);
          sendJson(response, 202, {
            ok: true,
            jobId: jobRequest.jobId,
            status: "queued",
          });
          return;
        }

        const result: WorkerJobResult = await runWorkerSyncJob(
          jobRequest,
          slot,
          runtime,
          config.jobTimeoutMs
        );

        sendJson(response, result.status === "completed" ? 200 : 500, result);
        return;
      }

      sendJson(response, 404, {
        ok: false,
        code: "NOT_FOUND",
        message: "Rota não encontrada.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendJson(response, error.status, {
          ok: false,
          code: error.code,
          message: error.message,
        });
        return;
      }

      sendJson(response, 500, {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Erro interno do worker.",
      });
    }
  });

  return { server, config, slot, runtime };
}

export function registerGracefulShutdown(options: {
  server: http.Server;
  runtime: WorkerRuntimeState;
  shutdownGraceMs: number;
}): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.info(`[worker] ${signal} — graceful shutdown iniciado.`);
    options.runtime.stopAcceptingJobs();

    const forceTimer = setTimeout(() => {
      console.error("[worker] Timeout de shutdown — encerrando processo.");
      process.exit(1);
    }, options.shutdownGraceMs);

    const waitForJob = (): void => {
      if (!options.runtime.isBusy()) {
        clearTimeout(forceTimer);
        options.server.close(() => {
          console.info("[worker] HTTP encerrado. Bye.");
          process.exit(0);
        });
        return;
      }

      setTimeout(waitForJob, 500);
    };

    waitForJob();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export function startWorkerServer(): http.Server {
  const { server, config, runtime } = createWorkerServer();

  registerGracefulShutdown({
    server,
    runtime,
    shutdownGraceMs: config.shutdownGraceMs,
  });

  server.listen(config.port, () => {
    console.info(
      `[worker] SIGAA Playwright worker ouvindo :${config.port} · maxConcurrent=${config.maxConcurrent}`
    );
  });

  return server;
}
