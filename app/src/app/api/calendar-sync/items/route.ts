export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { loadCalendarSyncItems } from "@/lib/calendar-sync/load-calendar-sync-items";
import { requireCalendarSyncUserId } from "@/lib/calendar-sync/require-calendar-sync-user";
import { pgGetCalendarSyncSettings } from "@/lib/db/postgres/calendar-sync-settings";

/** Itens já filtrados pelas preferências — o app Android grava no calendário do aparelho. */
export const GET = withDb(async () => {
  const userId = requireCalendarSyncUserId();
  const settings = await pgGetCalendarSyncSettings(userId);
  const items = await loadCalendarSyncItems({
    categories: settings.categories,
    reminders: settings.reminders,
  });
  return apiSuccess({ items, settings });
});
