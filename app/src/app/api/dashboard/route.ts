export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withDb } from "@/lib/api/with-db";
import { buildDashboard } from "@/lib/dashboard/build-dashboard";
import { buildDashboardFromQueries } from "@/lib/dashboard/build-dashboard-async";
import { postgresQueryDeps } from "@/lib/db/postgres/query-port";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const dashboard = await buildDashboardFromQueries(postgresQueryDeps);
    return apiSuccess(dashboard);
  }

  const dashboard = buildDashboard();
  return apiSuccess(dashboard);
});
