export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { validationError } from "@/lib/api/errors";
import {
  mergeCalendarSyncPreferences,
  parsePatchCalendarSyncSettingsBody,
} from "@/lib/calendar-sync/parse-calendar-sync-patch";
import { requireCalendarSyncUserId } from "@/lib/calendar-sync/require-calendar-sync-user";
import {
  pgGetCalendarSyncSettings,
  pgUpsertCalendarSyncPreferences,
} from "@/lib/db/postgres/calendar-sync-settings";

export const GET = withDb(async () => {
  const userId = requireCalendarSyncUserId();
  return apiSuccess(await pgGetCalendarSyncSettings(userId));
});

export const PATCH = withDb(async (request) => {
  const userId = requireCalendarSyncUserId();
  const rawBody = await request.json().catch(() => {
    throw validationError("JSON inválido.");
  });
  const patch = parsePatchCalendarSyncSettingsBody(rawBody);
  const current = await pgGetCalendarSyncSettings(userId);
  const saved = await pgUpsertCalendarSyncPreferences(
    userId,
    mergeCalendarSyncPreferences(current, patch)
  );
  return apiSuccess(saved);
});
