export const dynamic = "force-dynamic";

import { unauthorizedError } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchPerfilBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { buildPerfil } from "@/lib/perfil/build-perfil";
import { buildPerfilCloud } from "@/lib/perfil/build-perfil-cloud";
import { patchPerfil } from "@/lib/perfil/patch-perfil";
import { patchPerfilCloud } from "@/lib/perfil/patch-perfil-cloud";

export const runtime = "nodejs";

const SIGAA_USER_HEADER = "x-planner-sigaa-user";

async function resolveCloudProfile(request: Request) {
  const fromBearer = await resolveProfileFromAuthorization(
    request.headers.get("Authorization")
  );
  if (fromBearer) {
    return fromBearer;
  }

  const headerCpf = request.headers.get(SIGAA_USER_HEADER)?.trim();
  if (!headerCpf) {
    return null;
  }

  return findProfileByCpf(normalizeCpf(headerCpf));
}

export const GET = withDb(async (request) => {
  if (isPostgresBackend()) {
    const profile = await resolveCloudProfile(request);
    if (profile) {
      return apiSuccess(await buildPerfilCloud(profile));
    }
  }

  return apiSuccess(buildPerfil());
});

export const PATCH = withDb(async (request) => {
  const body = parsePatchPerfilBody(await request.json());

  if (isPostgresBackend()) {
    const profile = await resolveCloudProfile(request);
    if (!profile) {
      throw unauthorizedError(
        "Sessão ausente ou inválida. Faça login com CPF e senha."
      );
    }

    return apiSuccess(await patchPerfilCloud(profile, body));
  }

  return apiSuccess(patchPerfil(body));
});
