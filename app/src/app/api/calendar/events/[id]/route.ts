export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchCalendarEventBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { patchCalendarEvent } from "@/lib/calendar/patch-calendar-event";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withDb(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const body = parsePatchCalendarEventBody(await request.json());
  const data = patchCalendarEvent(id, body);
  return apiSuccess(data);
});
