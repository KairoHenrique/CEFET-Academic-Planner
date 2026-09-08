export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError, unauthorizedError, validationError } from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { buildIngestSnapshotFromPortal } from "@/lib/device-sync/build-ingest-snapshot";
import { extractPortalRawFromHtml } from "@/lib/scraper/portal-discente/extract-portal-raw";
import {
  assertPortalSnapshot,
  parsePortalPageData,
} from "@/lib/scraper/portal-discente/parse-portal-page";
import { ingestUserSnapshotForProfile } from "@/lib/sync-ingest/ingest-user-snapshot";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HTML_CHARS = 2_000_000;

/**
 * Ingest a partir do HTML do portal raspado no aparelho (mobile).
 * O client só envia HTML — parse + persist ficam no servidor.
 */
export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError("Ingest HTML só no deploy cloud/Postgres.");
    }

    await ensurePostgresReady();
    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError("Faça login para enviar o HTML do portal.");
    }
    await enforceSubscriptionAccessGate(profile);

    const body = (await request.json()) as Record<string, unknown>;
    const html = typeof body.portalHtml === "string" ? body.portalHtml : "";
    if (!html.trim()) {
      throw validationError("portalHtml é obrigatório.");
    }
    if (html.length > MAX_HTML_CHARS) {
      throw validationError("HTML do portal muito grande.");
    }

    const raw = extractPortalRawFromHtml(html);
    raw.html = html;
    const portal = parsePortalPageData(raw, profile.cursoId);
    assertPortalSnapshot(portal);
    const snapshot = buildIngestSnapshotFromPortal(portal);
    const result = await ingestUserSnapshotForProfile(profile, snapshot);

    return apiSuccess({ ...result, via: "portal-html" as const }, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
