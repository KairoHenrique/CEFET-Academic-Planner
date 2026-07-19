import { getPostgresPool } from "@/lib/db/postgres/pool";

const PUSH_SENT_CONFIG_KEY = "push.sent_fingerprints";
const MAX_STORED = 400;

function parseFingerprints(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function pgGetPushSentFingerprints(
  userId: string
): Promise<Set<string>> {
  const result = await getPostgresPool().query<{ valor: string }>(
    `SELECT valor FROM configuracoes
     WHERE user_id = $1 AND chave = $2
     LIMIT 1`,
    [userId, PUSH_SENT_CONFIG_KEY]
  );
  return new Set(parseFingerprints(result.rows[0]?.valor));
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

  const existing = await pgGetPushSentFingerprints(userId);
  for (const fingerprint of cleaned) {
    existing.add(fingerprint);
  }

  const next = Array.from(existing).slice(-MAX_STORED);

  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE
       SET valor = EXCLUDED.valor`,
    [userId, PUSH_SENT_CONFIG_KEY, JSON.stringify(next)]
  );
}
