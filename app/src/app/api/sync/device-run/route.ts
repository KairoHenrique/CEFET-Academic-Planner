export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  ApiError,
  unauthorizedError,
} from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { ScraperError } from "@/lib/scraper/errors";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Monólito edge desativado: estoura CPU no Workers free (1102).
 * Fallback web = browser + `/api/sync/sigaa-relay` (hops curtos).
 */
export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError("device-run só no deploy cloud/Postgres.");
    }

    await ensurePostgresReady();
    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError("Faça login para sincronizar.");
    }
    await enforceSubscriptionAccessGate(profile);

    throw ScraperError.offline(
      "Não foi possível sincronizar agora. Tente novamente em alguns minutos."
    );
  } catch (error) {
    if (error instanceof ScraperError) {
      return apiErrorResponse(error.toApiError());
    }
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
