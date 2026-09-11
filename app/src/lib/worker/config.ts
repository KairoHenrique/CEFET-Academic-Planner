const DEFAULT_PORT = 8787;
const DEFAULT_MAX_CONCURRENT = 1;
/**
 * Timeout do job Playwright inteiro.
 *
 * Decisão (Termux-first, set/2026): Chromium ARM no tablet demora mais que Chrome no PC.
 * Default antigo = 8 min → UI/worker matavam sync ainda em andamento.
 * Default atual = 15 min (alinhado aos polls do app — ver README §10).
 * Override: SIGAA_WORKER_JOB_TIMEOUT_MS.
 */
const DEFAULT_JOB_TIMEOUT_MS = 15 * 60 * 1000;
/** Grace > job timeout para o processo terminar limpo no shutdown. */
const DEFAULT_SHUTDOWN_MS = 18 * 60 * 1000;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export interface WorkerConfig {
  port: number;
  sharedSecret: string;
  maxConcurrent: number;
  jobTimeoutMs: number;
  shutdownGraceMs: number;
  dataRoot: string;
}

export function loadWorkerConfig(
  env: NodeJS.ProcessEnv = process.env
): WorkerConfig {
  const sharedSecret = env.WORKER_SHARED_SECRET?.trim() ?? "";
  if (sharedSecret.length < 16) {
    throw new Error(
      "WORKER_SHARED_SECRET ausente ou curto (mín. 16 caracteres)."
    );
  }

  return {
    port: parsePositiveInt(env.WORKER_PORT, DEFAULT_PORT),
    sharedSecret,
    maxConcurrent: parsePositiveInt(
      env.SIGAA_WORKER_MAX_CONCURRENT,
      DEFAULT_MAX_CONCURRENT
    ),
    jobTimeoutMs: parsePositiveInt(
      env.SIGAA_WORKER_JOB_TIMEOUT_MS,
      DEFAULT_JOB_TIMEOUT_MS
    ),
    shutdownGraceMs: parsePositiveInt(
      env.SIGAA_WORKER_SHUTDOWN_MS,
      DEFAULT_SHUTDOWN_MS
    ),
    dataRoot: env.PLANNER_DATA_ROOT?.trim() || ".data",
  };
}
