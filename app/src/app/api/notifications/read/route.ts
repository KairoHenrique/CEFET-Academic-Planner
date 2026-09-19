export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import { taskIdentityKeyFromFingerprint } from "@/lib/notifications/notification-fingerprint";
import {
  pgGetNotificationHistory,
  pgMarkTaskIdentitiesSeen,
  pgSaveNotificationHistory,
} from "@/lib/push/push-sent-fingerprints-store";

/**
 * Marca fingerprints como lidos no sino E como ja enviados no push
 * (evita re-push apos sync de itens que o aluno ja viu).
 */
export const POST = withDb(async (req) => {
  if (!isPostgresBackend()) {
    return NextResponse.json({ success: true, local: true });
  }

  const userId = getActiveTenantUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fingerprints: string[] = Array.isArray(body?.fingerprints)
      ? body.fingerprints.filter((v: unknown) => typeof v === "string")
      : [];
    if (fingerprints.length === 0) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const history = await pgGetNotificationHistory(userId);
    const now = new Date().toISOString();
    let changed = false;
    const identities: string[] = [];

    for (const fp of fingerprints) {
      const trimmed = fp.trim();
      if (!trimmed) continue;
      const existing = history.get(trimmed);
      if (existing) {
        if (!existing.isRead || !existing.pushed) {
          history.set(trimmed, {
            ...existing,
            isRead: true,
            pushed: true,
          });
          changed = true;
        }
      } else {
        history.set(trimmed, {
          fingerprint: trimmed,
          discoveredAt: now,
          isRead: true,
          pushed: true,
        });
        changed = true;
      }
      const identity = taskIdentityKeyFromFingerprint(trimmed);
      if (identity) identities.push(identity);
    }

    if (changed) {
      await pgSaveNotificationHistory(userId, history);
    }
    await pgMarkTaskIdentitiesSeen(userId, identities);

    return NextResponse.json({ success: true, updated: changed });
  } catch (err) {
    console.error("Failed to mark notifications read:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
});
