import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { apiErrorResponse } from "./response";

const SIGAA_USER_HEADER = "x-planner-sigaa-user";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response>;

function resolveUsernameFromRequest(request: Request): string | undefined {
  return request.headers.get(SIGAA_USER_HEADER)?.trim() || undefined;
}

export function withDb<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request, context) => {
    const username = resolveUsernameFromRequest(request);

    return runWithUserDb(username, async () => {
      try {
        ensureDbReady();
        return await handler(request, context);
      } catch (error) {
        return apiErrorResponse(error);
      }
    });
  };
}

export { SIGAA_USER_HEADER };
