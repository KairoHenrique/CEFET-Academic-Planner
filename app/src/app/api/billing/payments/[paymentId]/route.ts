export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  authUnavailableError,
  sqliteDisabledError,
  unauthorizedError,
} from "@/lib/api/errors";
import { assertCloudAccountAuthAvailable } from "@/lib/auth/account/cloud-auth-guard";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { getBillingPaymentStatusForUser } from "@/lib/billing/payments/get-billing-payment-status";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

export const GET = async (request: Request, context: RouteContext) => {
  try {
    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Pagamento PIX disponível apenas no modo cloud (Postgres)."
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

    const { paymentId } = await context.params;
    const result = await getBillingPaymentStatusForUser({
      paymentId: paymentId.trim(),
      userId: profile.userId,
    });

    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
};
