const WINDOW_MS = 60_000;
/** Por token: o Google não consulta o mesmo feed mais que algumas vezes por hora. */
export const CALENDAR_FEED_MAX_PER_TOKEN = 10;
/** Por IP: alto porque os fetchers do Google compartilham IPs entre muitos usuários. */
export const CALENDAR_FEED_MAX_PER_IP = 300;
/** Limite de chaves em memória por isolate (evita crescimento sem teto sob abuso). */
const MAX_TRACKED_KEYS = 5_000;

const requestLog = new Map<string, number[]>();

function pruneIfOversized(now: number): void {
  if (requestLog.size < MAX_TRACKED_KEYS) return;
  for (const [key, timestamps] of requestLog) {
    if (timestamps.every((timestamp) => now - timestamp > WINDOW_MS)) requestLog.delete(key);
  }
  if (requestLog.size >= MAX_TRACKED_KEYS) requestLog.clear();
}

/** Best-effort por isolate; o token de 256 bits já torna força bruta inviável. */
export function allowCalendarFeedRequest(
  key: string,
  maxPerWindow: number,
  now = Date.now()
): boolean {
  pruneIfOversized(now);
  const recent = (requestLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp <= WINDOW_MS
  );
  if (recent.length >= maxPerWindow) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

export function resolveCalendarFeedClientKey(request: Request): string {
  const ip =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `ip:${ip}`;
}

/** Prefixo do token basta como chave e evita manter o segredo inteiro em memória. */
export function resolveCalendarFeedTokenKey(token: string): string {
  return `tk:${token.slice(0, 16)}`;
}

export function resetCalendarFeedRateLimitForTests(): void {
  requestLog.clear();
}
