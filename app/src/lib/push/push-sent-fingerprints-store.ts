import { getPostgresPool } from "@/lib/db/postgres/pool";

const PUSH_SENT_CONFIG_KEY = "push.sent_fingerprints";
/** Identidades estáveis de tarefa — não sofrem truncamento do histórico do sino. */
const PUSH_TASK_IDENTITIES_KEY = "push.sent_task_identities";
const MAX_STORED = 800;
const MAX_TASK_IDENTITIES = 300;

export interface NotificationHistoryState {
  fingerprint: string;
  discoveredAt: string;
  isRead: boolean;
  /** Já disparou Expo push (separado do isRead do sino). */
  pushed: boolean;
}

function parseHistory(raw: string | null | undefined): Map<string, NotificationHistoryState> {
  const map = new Map<string, NotificationHistoryState>();
  if (!raw?.trim()) return map;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;

    for (const item of parsed) {
      if (typeof item === "string") {
        map.set(item, {
          fingerprint: item,
          discoveredAt: new Date().toISOString(),
          isRead: true,
          pushed: true,
        });
      } else if (
        item &&
        typeof item === "object" &&
        typeof item.fingerprint === "string"
      ) {
        const hasPushedField = typeof item.pushed === "boolean";
        map.set(item.fingerprint, {
          fingerprint: item.fingerprint,
          discoveredAt: item.discoveredAt || new Date().toISOString(),
          isRead: Boolean(item.isRead),
          pushed: hasPushedField ? Boolean(item.pushed) : true,
        });
      }
    }
  } catch {
    // Ignore invalid JSON
  }
  return map;
}

function parseIdentityList(raw: string | null | undefined): Set<string> {
  const set = new Set<string>();
  if (!raw?.trim()) return set;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return set;
    for (const item of parsed) {
      if (typeof item === "string" && item.trim()) set.add(item.trim());
    }
  } catch {
    // ignore
  }
  return set;
}

export async function pgGetNotificationHistory(
  userId: string
): Promise<Map<string, NotificationHistoryState>> {
  const result = await getPostgresPool().query<{ valor: string }>(
    `SELECT valor FROM configuracoes
     WHERE user_id = $1 AND chave = $2
     LIMIT 1`,
    [userId, PUSH_SENT_CONFIG_KEY]
  );
  return parseHistory(result.rows[0]?.valor);
}

export async function pgSaveNotificationHistory(
  userId: string,
  history: Map<string, NotificationHistoryState>
): Promise<void> {
  const next = Array.from(history.values())
    .sort((a, b) => {
      if (a.pushed !== b.pushed) return Number(a.pushed) - Number(b.pushed);
      return (
        new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime()
      );
    })
    .slice(-MAX_STORED);

  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE
       SET valor = EXCLUDED.valor`,
    [userId, PUSH_SENT_CONFIG_KEY, JSON.stringify(next)]
  );
}

/** Fingerprints que já dispararam push (não as apenas descobertas no sino). */
export async function pgGetPushSentFingerprints(
  userId: string
): Promise<Set<string>> {
  const history = await pgGetNotificationHistory(userId);
  const sent = new Set<string>();
  for (const state of history.values()) {
    if (state.pushed) sent.add(state.fingerprint);
  }
  return sent;
}

export async function pgMarkPushFingerprintsSent(
  userId: string,
  fingerprints: string[]
): Promise<void> {
  const cleaned = [
    ...new Set(fingerprints.map((value) => value.trim()).filter(Boolean)),
  ];
  if (cleaned.length === 0) return;

  const history = await pgGetNotificationHistory(userId);
  const now = new Date().toISOString();

  for (const fingerprint of cleaned) {
    const existing = history.get(fingerprint);
    if (existing) {
      history.set(fingerprint, { ...existing, pushed: true });
    } else {
      history.set(fingerprint, {
        fingerprint,
        discoveredAt: now,
        isRead: false,
        pushed: true,
      });
    }
  }

  await pgSaveNotificationHistory(userId, history);
}

export async function pgGetSentTaskIdentities(
  userId: string
): Promise<Set<string>> {
  const result = await getPostgresPool().query<{ valor: string }>(
    `SELECT valor FROM configuracoes
     WHERE user_id = $1 AND chave = $2
     LIMIT 1`,
    [userId, PUSH_TASK_IDENTITIES_KEY]
  );
  return parseIdentityList(result.rows[0]?.valor);
}

export async function pgMarkTaskIdentitiesSeen(
  userId: string,
  identities: string[]
): Promise<void> {
  const cleaned = [
    ...new Set(identities.map((value) => value.trim()).filter(Boolean)),
  ];
  if (cleaned.length === 0) return;

  const current = await pgGetSentTaskIdentities(userId);
  for (const identity of cleaned) current.add(identity);

  const next = [...current].slice(-MAX_TASK_IDENTITIES);
  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE
       SET valor = EXCLUDED.valor`,
    [userId, PUSH_TASK_IDENTITIES_KEY, JSON.stringify(next)]
  );
}
