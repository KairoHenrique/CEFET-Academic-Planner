export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  authUnavailableError,
  sqliteDisabledError,
  unauthorizedError,
  validationError,
} from "@/lib/api/errors";
import { assertCloudAccountAuthAvailable } from "@/lib/auth/account/cloud-auth-guard";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import {
  createBillingCheckout,
  resolveCheckoutIdempotencyKey,
} from "@/lib/billing/checkout/create-billing-checkout";
import {
  parseBillingCheckoutRequest,
  readIdempotencyKeyFromHeaders,
} from "@/lib/billing/checkout/parse-billing-checkout-request";
import { APP_IS_FREE } from "@/lib/billing/free-mode";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    if (APP_IS_FREE) {
      throw validationError(
        "O ACME HUB é gratuito. Checkout PIX está desativado."
      );
    }

    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Checkout PIX disponível apenas no modo cloud (Postgres)."
      );
    }

    try {
      assertCloudAccountAuthAvailable();
    } catch {
      throw authUnavailableError();
    }

    await ensurePostgresReady();

    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError(
        "Sessão ausente ou inválida. Faça login com CPF e senha."
      );
    }

    const body = await request.json();
    const parsed = parseBillingCheckoutRequest(body);
    const idempotencyKey = resolveCheckoutIdempotencyKey(
      readIdempotencyKeyFromHeaders(request),
      parsed.idempotencyKey
    );

    const result = await createBillingCheckout({
      userId: profile.userId,
      cpf: profile.cpf,
      email: profile.email,
      planId: parsed.planId,
      idempotencyKey,
    });

    return apiSuccess(result, result.reused ? 200 : 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
};
