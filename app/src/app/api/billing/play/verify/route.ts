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
import { verifyAndActivatePlayPurchase } from "@/lib/billing/play/verify-play-purchase";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Play Billing disponivel apenas no modo cloud (Postgres)."
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
        "Sessao ausente ou invalida. Faca login com CPF e senha."
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      productId?: unknown;
      purchaseToken?: unknown;
    };
    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const purchaseToken =
      typeof body.purchaseToken === "string" ? body.purchaseToken.trim() : "";
    if (!productId || !purchaseToken) {
      throw validationError("productId e purchaseToken sao obrigatorios.");
    }

    const result = await verifyAndActivatePlayPurchase({
      userId: profile.userId,
      cpf: profile.cpf,
      productId,
      purchaseToken,
    });

    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
};
