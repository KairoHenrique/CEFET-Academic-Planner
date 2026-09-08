export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { unauthorizedError } from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { ingestUserSnapshotForProfile } from "@/lib/sync-ingest/ingest-user-snapshot";
import { parseIngestSnapshotBody } from "@/lib/sync-ingest/parse-ingest-snapshot";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Ingest do sync híbrido (§6.1.1): snapshot raspado no aparelho → Supabase.
 * Autenticado por Bearer; sem senha SIGAA no body.
 */
export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError(
        "Ingest disponível apenas no deploy cloud/Postgres."
      );
    }

    await ensurePostgresReady();

    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError("Faça login para enviar o sync do aparelho.");
    }

    await enforceSubscriptionAccessGate(profile);

    const body = await request.json();
    const { snapshot } = parseIngestSnapshotBody(body);
    const result = await ingestUserSnapshotForProfile(profile, snapshot);

    return apiSuccess(result, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
