export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { sqliteDisabledError } from "@/lib/api/errors";
import { processMockBillingWebhook } from "@/lib/billing/webhook/process-mock-billing-webhook";
import { isPostgresBackend } from "@/lib/db/backend/config";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Mock webhook PIX disponível apenas no modo cloud (Postgres)."
      );
    }

    const result = await processMockBillingWebhook(request);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
};
