export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildDashboard } from "@/lib/dashboard/build-dashboard";

export const GET = withDb(async () => {
  const dashboard = buildDashboard();
  return apiSuccess(dashboard);
});
