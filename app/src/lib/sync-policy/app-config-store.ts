import fs from "node:fs";
import path from "node:path";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  SYNC_POLICY_OVERRIDES_KEY,
  SYNC_ORCHESTRATOR_STATE_PREFIX,
} from "@/lib/sync-policy/schema-catalog";
import {
  mergeSyncPolicyOverrides,
  parseSyncPolicyOverrides,
} from "@/lib/sync-policy/merge-effective-policy";
import type { EffectiveSyncPolicy, SyncPolicyOverrides } from "@/lib/sync-policy/types";

type JsonValue =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

function serializeJsonbValue(value: JsonValue): string {
  return JSON.stringify(value);
}

function parseJsonbValue(raw: unknown): JsonValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as JsonValue;
    } catch {
      return raw;
    }
  }

  return raw as JsonValue;
}

let memoryStore = new Map<string, JsonValue>();

function resolveLocalPolicyPath(): string {
  const root = process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data");
  return path.join(root, "ops-sync-policy.json");
}

function readLocalFileStore(): Map<string, JsonValue> {
  const filePath = resolveLocalPolicyPath();
  if (!fs.existsSync(filePath)) {
    return new Map();
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    JsonValue
  >;
  return new Map(Object.entries(parsed));
}

function writeLocalFileStore(store: Map<string, JsonValue>): void {
  const filePath = resolveLocalPolicyPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const obj = Object.fromEntries(store.entries());
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

function activeStore(): Map<string, JsonValue> {
  if (process.env.SYNC_POLICY_STORE === "memory") {
    return memoryStore;
  }

  if (isPostgresBackend()) {
    throw new Error("Use métodos async pg* para backend Postgres.");
  }

  return readLocalFileStore();
}

export function resetAppConfigStoreForTests(): void {
  memoryStore = new Map();
}

export function setSyncPolicyStoreModeForTests(mode: "memory" | "file"): void {
  process.env.SYNC_POLICY_STORE = mode;
}

export async function pgGetAppConfigJson(chave: string): Promise<JsonValue | null> {
  const pool = getPostgresPool();
  const result = await pool.query<{ valor: JsonValue }>(
    `SELECT valor FROM app_config WHERE chave = $1 LIMIT 1`,
    [chave]
  );
  return parseJsonbValue(result.rows[0]?.valor ?? null);
}

export async function pgSetAppConfigJson(
  chave: string,
  valor: JsonValue
): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `INSERT INTO app_config (chave, valor, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (chave) DO UPDATE
     SET valor = EXCLUDED.valor, updated_at = now()`,
    [chave, serializeJsonbValue(valor)]
  );
}

export async function pgGetSyncPolicyOverrides(): Promise<SyncPolicyOverrides | null> {
  const raw = await pgGetAppConfigJson(SYNC_POLICY_OVERRIDES_KEY);
  if (raw === null) return null;
  return parseSyncPolicyOverrides(raw);
}

export async function pgSetSyncPolicyOverrides(
  overrides: SyncPolicyOverrides
): Promise<void> {
  await pgSetAppConfigJson(SYNC_POLICY_OVERRIDES_KEY, overrides);
}

export async function readEffectiveSyncPolicyAsync(): Promise<EffectiveSyncPolicy> {
  if (isPostgresBackend()) {
    const overrides = await pgGetSyncPolicyOverrides();
    return mergeSyncPolicyOverrides(overrides);
  }

  const store = activeStore();
  const raw = store.get(SYNC_POLICY_OVERRIDES_KEY) ?? null;
  return mergeSyncPolicyOverrides(parseSyncPolicyOverrides(raw));
}

export function readEffectiveSyncPolicySync(): EffectiveSyncPolicy {
  const store = activeStore();
  const raw = store.get(SYNC_POLICY_OVERRIDES_KEY) ?? null;
  return mergeSyncPolicyOverrides(parseSyncPolicyOverrides(raw));
}

export function writeSyncPolicyOverridesSync(
  overrides: SyncPolicyOverrides
): void {
  if (isPostgresBackend()) {
    throw new Error("Use writeSyncPolicyOverridesAsync no Postgres.");
  }

  const store = activeStore();
  store.set(SYNC_POLICY_OVERRIDES_KEY, overrides);
  if (process.env.SYNC_POLICY_STORE !== "memory") {
    writeLocalFileStore(store);
  } else {
    memoryStore = store;
  }
}

export async function writeSyncPolicyOverridesAsync(
  overrides: SyncPolicyOverrides
): Promise<void> {
  if (isPostgresBackend()) {
    await pgSetSyncPolicyOverrides(overrides);
    return;
  }

  writeSyncPolicyOverridesSync(overrides);
}

export async function readSyncPolicyOverridesAsync(): Promise<SyncPolicyOverrides | null> {
  if (isPostgresBackend()) {
    return pgGetSyncPolicyOverrides();
  }

  const store = activeStore();
  const raw = store.get(SYNC_POLICY_OVERRIDES_KEY) ?? null;
  return parseSyncPolicyOverrides(raw);
}

export async function pgGetOrchestratorState(
  suffix: string
): Promise<string | null> {
  const raw = await pgGetAppConfigJson(`${SYNC_ORCHESTRATOR_STATE_PREFIX}${suffix}`);
  if (raw === null) return null;
  if (typeof raw === "string") return raw;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "at" in raw &&
    typeof (raw as { at: unknown }).at === "string"
  ) {
    return (raw as { at: string }).at;
  }
  return null;
}

export async function pgSetOrchestratorState(
  suffix: string,
  isoTimestamp: string
): Promise<void> {
  await pgSetAppConfigJson(`${SYNC_ORCHESTRATOR_STATE_PREFIX}${suffix}`, {
    at: isoTimestamp,
  });
}

export function getOrchestratorStateKey(suffix: string): string {
  return `${SYNC_ORCHESTRATOR_STATE_PREFIX}${suffix}`;
}
