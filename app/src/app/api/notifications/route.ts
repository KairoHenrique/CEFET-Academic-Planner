export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { buildNotificationSnapshot } from "@/lib/notifications/build-notification-snapshot";
import { buildNotificationSnapshotCloud } from "@/lib/notifications/build-notification-snapshot-cloud";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    return apiSuccess(await buildNotificationSnapshotCloud());
  }

  return apiSuccess(buildNotificationSnapshot());
});
