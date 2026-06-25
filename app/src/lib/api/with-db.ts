import { ensureDbReady } from "@/lib/db/bootstrap";
import { apiErrorResponse } from "./response";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response>;

export function withDb<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request, context) => {
    try {
      ensureDbReady();
      return await handler(request, context);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
