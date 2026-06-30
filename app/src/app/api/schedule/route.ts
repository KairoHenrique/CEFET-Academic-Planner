export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildScheduleGrid } from "@/lib/schedule/build-schedule-grid";

export const GET = withDb(async () => {
  const schedule = buildScheduleGrid();
  return apiSuccess(schedule);
});
