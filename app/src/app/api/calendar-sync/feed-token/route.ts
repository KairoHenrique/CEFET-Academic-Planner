export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import {
  buildCalendarFeedUrls,
  generateCalendarFeedToken,
  hashCalendarFeedToken,
} from "@/lib/calendar-sync/calendar-feed-token";
import { requireCalendarSyncUserId } from "@/lib/calendar-sync/require-calendar-sync-user";
import type { CalendarFeedLinkView } from "@/lib/calendar-sync/types";
import { pgSetCalendarFeedTokenHash } from "@/lib/db/postgres/calendar-sync-settings";

/** Gera um link novo (revoga o anterior). O token só é devolvido nesta resposta. */
export const POST = withDb(async () => {
  const userId = requireCalendarSyncUserId();
  const token = generateCalendarFeedToken();
  const settings = await pgSetCalendarFeedTokenHash(userId, await hashCalendarFeedToken(token));
  const body: CalendarFeedLinkView = { ...buildCalendarFeedUrls(token), settings };
  const response = apiSuccess(body);
  response.headers.set("Cache-Control", "no-store");
  return response;
});

export const DELETE = withDb(async () => {
  const userId = requireCalendarSyncUserId();
  return apiSuccess(await pgSetCalendarFeedTokenHash(userId, null));
});
