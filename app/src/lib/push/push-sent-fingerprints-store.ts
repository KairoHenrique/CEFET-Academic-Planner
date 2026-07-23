import { getPostgresPool } from "@/lib/db/postgres/pool";

const PUSH_SENT_CONFIG_KEY = "push.sent_fingerprints";
const MAX_STORED = 400;

export interface NotificationHistoryState {
  fingerprint: string;
  discoveredAt: string;
  isRead: boolean;
}

function parseHistory(raw: string | null | undefined): Map<string, NotificationHistoryState> {
  const map = new Map<string, NotificationHistoryState>();
  if (!raw?.trim()) return map;
  
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;
    
    for (const item of parsed) {
      if (typeof item === "string") {
        // Migration from legacy array of strings
        map.set(item, {
          fingerprint: item,
          discoveredAt: new Date().toISOString(),
          isRead: true, // Assume legacy notifications are read so we don't spam unread
        });
      } else if (item && typeof item === "object" && typeof item.fingerprint === "string") {
        map.set(item.fingerprint, {
          fingerprint: item.fingerprint,
          discoveredAt: item.discoveredAt || new Date().toISOString(),
          isRead: Boolean(item.isRead),
        });
      }
    }
  } catch {
    // Ignore invalid JSON
  }
  return map;
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
    .sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime())
    .slice(-MAX_STORED);

  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE
       SET valor = EXCLUDED.valor`,
    [userId, PUSH_SENT_CONFIG_KEY, JSON.stringify(next)]
  );
}

export async function pgGetPushSentFingerprints(
  userId: string
): Promise<Set<string>> {
  const history = await pgGetNotificationHistory(userId);
  return new Set(history.keys());
}

export async function pgMarkPushFingerprintsSent(
  userId: string,
  fingerprints: string[]
): Promise<void> {
  const cleaned = [
    ...new Set(
      fingerprints.map((value) => value.trim()).filter(Boolean)
    ),
  ];
  if (cleaned.length === 0) return;

  const history = await pgGetNotificationHistory(userId);
  const now = new Date().toISOString();
  
  for (const fingerprint of cleaned) {
    if (!history.has(fingerprint)) {
      history.set(fingerprint, { fingerprint, discoveredAt: now, isRead: false });
    }
  }

  await pgSaveNotificationHistory(userId, history);
}
