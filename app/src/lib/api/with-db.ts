import { ensureDbReady } from "@/lib/db/bootstrap";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runWithQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import {
  enforceAppAccessGate,
  shouldEnforceAccessGate,
} from "@/lib/auth/access/access-gate";
import { apiErrorResponse } from "./response";

const SIGAA_USER_HEADER = "x-planner-sigaa-user";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response>;

function resolveUsernameFromRequest(request: Request): string | undefined {
  return request.headers.get(SIGAA_USER_HEADER)?.trim() || undefined;
}

async function ensureDatabaseReady(): Promise<void> {
  if (isPostgresBackend()) {
    await ensurePostgresReady();
    return;
  }
  ensureDbReady();
}

export function withDb<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request, context) => {
    const username = resolveUsernameFromRequest(request);

    const runHandler = async () => {
      try {
        await ensureDatabaseReady();
        return await handler(request, context);
      } catch (error) {
        return apiErrorResponse(error);
      }
    };

    if (isPostgresBackend()) {
      const profile = await resolveProfileFromAuthorization(
        request.headers.get("Authorization")
      );

      if (shouldEnforceAccessGate(request)) {
        try {
          await enforceAppAccessGate(profile);
        } catch (error) {
          return apiErrorResponse(error);
        }
      }

      const scopedUsername = profile?.cpf ?? username;

      return runWithQueryCursoId(profile?.cursoId, () =>
        runWithUserDb(scopedUsername, runHandler)
      );
    }

    return runWithUserDb(username, runHandler);
  };
}

export { SIGAA_USER_HEADER };
