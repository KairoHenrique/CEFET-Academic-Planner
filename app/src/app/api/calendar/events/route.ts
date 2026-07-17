export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parseCreateCalendarEventBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { createCalendarEvent } from "@/lib/calendar/create-calendar-event";

export const POST = withDb(async (request) => {
  const body = parseCreateCalendarEventBody(await request.json());
  const event = await createCalendarEvent(body);
  return apiSuccess(event, 201);
});
