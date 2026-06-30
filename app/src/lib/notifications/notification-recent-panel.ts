import { getSession } from "@/lib/auth/session";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

const STORAGE_PREFIX = "planner:notifications:recent-panel:";
export const RECENT_PANEL_TTL_MS = 24 * 60 * 60 * 1000;

interface RecentPanelEntry {
  item: NotificationSnapshotItem;
  seenAt: string;
}

function storageKey(): string | null {
  const username = getSession()?.username?.trim();
  if (!username || typeof window === "undefined") return null;
  return `${STORAGE_PREFIX}${username}`;
}

function readEntries(): RecentPanelEntry[] {
  const key = storageKey();
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPanelEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: RecentPanelEntry[]): void {
  const key = storageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(entries));
}

function pruneExpired(entries: RecentPanelEntry[], now = Date.now()): RecentPanelEntry[] {
  return entries.filter((entry) => {
    const seenAt = Date.parse(entry.seenAt);
    if (!Number.isFinite(seenAt)) return false;
    return now - seenAt <= RECENT_PANEL_TTL_MS;
  });
}

export function readRecentPanelItems(now = Date.now()): NotificationSnapshotItem[] {
  const valid = pruneExpired(readEntries(), now);
  if (valid.length !== readEntries().length) {
    writeEntries(valid);
  }
  return valid.map((entry) => entry.item);
}

export function archiveRecentPanelItems(
  items: NotificationSnapshotItem[],
  seenAt = new Date().toISOString()
): void {
  if (items.length === 0) return;

  const now = Date.parse(seenAt);
  const byFingerprint = new Map<string, RecentPanelEntry>();

  for (const entry of pruneExpired(readEntries(), now)) {
    byFingerprint.set(entry.item.fingerprint, entry);
  }

  for (const item of items) {
    byFingerprint.set(item.fingerprint, {
      item,
      seenAt,
    });
  }

  writeEntries([...byFingerprint.values()]);
}
