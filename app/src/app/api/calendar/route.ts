export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildCalendar } from "@/lib/calendar/build-calendar";

export const GET = withDb(async () => {
  return apiSuccess(buildCalendar());
});
