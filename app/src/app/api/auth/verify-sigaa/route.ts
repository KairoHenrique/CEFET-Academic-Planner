export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { parseSyncRequest } from "@/lib/api/validate";
import { verifySigaaCredentials } from "@/lib/auth/verify-sigaa-credentials";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { ScraperError } from "@/lib/scraper/errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const credentials = parseSyncRequest(body);

    await runWithUserDb(credentials.username, async () => {
      ensureDbReady();
      await verifySigaaCredentials(credentials);
    });

    return apiSuccess({ ok: true as const });
  } catch (error) {
    if (error instanceof ScraperError) {
      return apiErrorResponse(error.toApiError());
    }
    return apiErrorResponse(error);
  }
};
