export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  guardCloudAccountRoute,
  refreshAccountSession,
} from "@/lib/auth/account/account-service";
import { validationError } from "@/lib/api/errors";

export const runtime = "nodejs";

function parseRefreshBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw validationError("Body inválido.");
  }
  const refreshToken = (body as { refreshToken?: unknown }).refreshToken;
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    throw validationError("refreshToken é obrigatório.");
  }
  return refreshToken.trim();
}

export const POST = async (request: Request) => {
  try {
    guardCloudAccountRoute();
    const body = await request.json();
    const refreshToken = parseRefreshBody(body);
    const session = await refreshAccountSession(refreshToken);

    return apiSuccess({
      ok: true as const,
      session,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
};
