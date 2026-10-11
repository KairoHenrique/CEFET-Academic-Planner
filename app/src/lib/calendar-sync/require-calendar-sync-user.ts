import { sqliteDisabledError, unauthorizedError } from "@/lib/api/errors";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";

/** Sincronização de agenda depende de conta cloud (Postgres + usuário autenticado). */
export function requireCalendarSyncUserId(): string {
  if (!isPostgresBackend()) {
    throw sqliteDisabledError("Sincronização de agenda disponível só no modo cloud.");
  }
  const userId = getActiveTenantUserId();
  if (!userId) throw unauthorizedError();
  return userId;
}
