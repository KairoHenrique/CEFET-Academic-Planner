export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import { pgGetNotificationHistory, pgSaveNotificationHistory } from "@/lib/push/push-sent-fingerprints-store";

export const POST = withDb(async (req) => {
  if (!isPostgresBackend()) {
    return NextResponse.json({ success: true, local: true });
  }

  const userId = getActiveTenantUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const fingerprints: string[] = body.fingerprints ?? [];
    if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const history = await pgGetNotificationHistory(userId);
    let changed = false;

    for (const fp of fingerprints) {
      const state = history.get(fp);
      if (state && !state.isRead) {
        state.isRead = true;
        changed = true;
      }
    }

    if (changed) {
      await pgSaveNotificationHistory(userId, history);
    }

    return NextResponse.json({ success: true, updated: changed });
  } catch (err) {
    console.error("Failed to mark notifications read:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
});
