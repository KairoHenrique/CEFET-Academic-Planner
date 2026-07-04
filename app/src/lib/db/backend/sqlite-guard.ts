import { ApiError } from "@/lib/api/errors";
import { isCloudDeployment, isPostgresBackend } from "@/lib/db/backend/config";

export function isSqliteAllowed(): boolean {
  return !isPostgresBackend() && !isCloudDeployment();
}

export function assertSqliteAllowed(context?: string): void {
  if (isSqliteAllowed()) {
    return;
  }

  const suffix = context ? ` (${context})` : "";
  throw new ApiError(
    "SQLITE_DISABLED",
    `SQLite local indisponível no modo cloud/postgres${suffix}.`,
    503,
    {
      backend: isPostgresBackend() ? "postgres" : "cloud",
    }
  );
}
