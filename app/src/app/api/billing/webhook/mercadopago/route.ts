export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { processMercadoPagoBillingWebhook } from "@/lib/billing/webhook/process-mercadopago-billing-webhook";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { sqliteDisabledError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Webhook PIX disponível apenas no modo cloud (Postgres)."
      );
    }

    const result = await processMercadoPagoBillingWebhook(request);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
};

export const GET = POST;
