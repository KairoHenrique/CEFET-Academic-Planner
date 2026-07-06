export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  authUnavailableError,
  sqliteDisabledError,
  unauthorizedError,
} from "@/lib/api/errors";
import { assertCloudAccountAuthAvailable } from "@/lib/auth/account/cloud-auth-guard";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { parseRedeemGiftKeyRequest } from "@/lib/billing/gift-keys/parse-redeem-gift-key-request";
import { redeemGiftKey } from "@/lib/billing/gift-keys/redeem-gift-key";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

function readClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    null
  );
}

export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw sqliteDisabledError(
        "Resgate de chave disponível apenas no modo cloud (Postgres)."
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
    const parsed = parseRedeemGiftKeyRequest(body);

    const result = await redeemGiftKey({
      userId: profile.userId,
      cpf: profile.cpf,
      code: parsed.code,
      clientIp: readClientIp(request),
    });

    return apiSuccess(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
};
