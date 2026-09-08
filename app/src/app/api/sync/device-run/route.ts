export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  ApiError,
  unauthorizedError,
  validationError,
} from "@/lib/api/errors";
import { findEncryptedPasswordByCpf } from "@/lib/auth/account/profile-repository";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { openServerSigaaPassword } from "@/lib/crypto/server-sigaa-credential-store";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { runDeviceR1Sync } from "@/lib/device-sync/run-device-r1-sync";
import { ScraperError } from "@/lib/scraper/errors";
import { ingestUserSnapshotForProfile } from "@/lib/sync-ingest/ingest-user-snapshot";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Fallback quando o PC worker está offline e o client não tem senha em memória
 * (ex.: mobile com vault). Roda scrape HTTP no edge (sem Playwright) + ingest.
 *
 * Preferência §6.1.1 continua sendo scrape no aparelho quando a senha está
 * disponível no client (`runDeviceFallbackSyncClient` / ingest-html).
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

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    let password =
      typeof body.password === "string" && body.password.trim()
        ? body.password.trim()
        : "";

    if (!password) {
      const enc = await findEncryptedPasswordByCpf(profile.cpf);
      if (!enc) {
        throw validationError(
          "Senha SIGAA não disponível. Informe a senha ou salve-a no perfil."
        );
      }
      password = openServerSigaaPassword(enc);
    }

    const { snapshot, steps } = await runDeviceR1Sync({
      username: profile.cpf,
      password,
      cursoId: profile.cursoId,
    });

    // Esquece a senha o mais cedo possível (LGPD).
    password = "";

    const result = await ingestUserSnapshotForProfile(profile, snapshot);
    return apiSuccess({ ...result, steps, via: "device-run" as const }, 200);
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
