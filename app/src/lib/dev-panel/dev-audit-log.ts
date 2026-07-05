import fs from "node:fs";
import path from "node:path";
import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  pgGetAppConfigJson,
  pgSetAppConfigJson,
} from "@/lib/sync-policy/app-config-store";
import type { DevAuditEntry } from "@/lib/dev-panel/types";
import { newDevAuditId } from "@/lib/dev-panel/operator-session";

const AUDIT_KEY = "dev.audit_log";
const MAX_ENTRIES = 200;

let memoryAuditLog: DevAuditEntry[] = [];

function resolveLocalAuditPath(): string {
  const root = process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data");
  return path.join(root, "dev-audit-log.json");
}

function readLocalAuditLog(): DevAuditEntry[] {
  const filePath = resolveLocalAuditPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as DevAuditEntry[];
  return Array.isArray(parsed) ? parsed : [];
}

function writeLocalAuditLog(entries: DevAuditEntry[]): void {
  const filePath = resolveLocalAuditPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries.slice(0, MAX_ENTRIES), null, 2), "utf8");
}

export function resetDevAuditLogForTests(): void {
  memoryAuditLog = [];
}

function normalizeAuditEntries(raw: unknown): DevAuditEntry[] {
  if (Array.isArray(raw)) {
    return raw as DevAuditEntry[];
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as DevAuditEntry[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function appendDevAuditLog(input: {
  operatorEmail: string;
  action: string;
  detail?: Record<string, unknown>;
}): Promise<DevAuditEntry> {
  const entry: DevAuditEntry = {
    id: newDevAuditId(),
    at: new Date().toISOString(),
    operatorEmail: input.operatorEmail.toLowerCase(),
    action: input.action,
    detail: input.detail ?? {},
  };

  if (isPostgresBackend()) {
    const raw = await pgGetAppConfigJson(AUDIT_KEY);
    const current = normalizeAuditEntries(raw);
    const next = [entry, ...current].slice(0, MAX_ENTRIES);
    await pgSetAppConfigJson(AUDIT_KEY, next);
    return entry;
  }

  if (process.env.DEV_AUDIT_STORE === "memory") {
    memoryAuditLog = [entry, ...memoryAuditLog].slice(0, MAX_ENTRIES);
    return entry;
  }

  const current = readLocalAuditLog();
  writeLocalAuditLog([entry, ...current]);
  return entry;
}

export async function listDevAuditLog(limit = 50): Promise<DevAuditEntry[]> {
  const capped = Math.min(Math.max(limit, 1), MAX_ENTRIES);

  if (isPostgresBackend()) {
    const raw = await pgGetAppConfigJson(AUDIT_KEY);
    const current = normalizeAuditEntries(raw);
    return current.slice(0, capped);
  }

  if (process.env.DEV_AUDIT_STORE === "memory") {
    return memoryAuditLog.slice(0, capped);
  }

  return readLocalAuditLog().slice(0, capped);
}
