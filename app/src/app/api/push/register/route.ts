export const dynamic = "force-dynamic";

import { unauthorizedError, validationError } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  deletePushDeviceToken,
  upsertPushDeviceToken,
} from "@/lib/push/push-token-repository";

export const runtime = "nodejs";

function parseTokenBody(body: unknown): {
  expoPushToken: string;
  platform: string;
} {
  if (!body || typeof body !== "object") {
    throw validationError("Body inválido.");
  }
  const expoPushToken = (body as { expoPushToken?: unknown }).expoPushToken;
  const platformRaw = (body as { platform?: unknown }).platform;
  if (typeof expoPushToken !== "string" || !expoPushToken.trim()) {
    throw validationError("expoPushToken é obrigatório.");
  }
  if (!expoPushToken.includes("ExponentPushToken")) {
    throw validationError("Token Expo Push inválido.");
  }
  const platform =
    typeof platformRaw === "string" && platformRaw.trim()
      ? platformRaw.trim()
      : "android";
  return { expoPushToken: expoPushToken.trim(), platform };
}

export const POST = withDb(async (request) => {
  if (!isPostgresBackend()) {
    throw validationError("Push indisponível neste ambiente.");
  }

  const profile = await resolveProfileFromAuthorization(
    request.headers.get("Authorization")
  );
  if (!profile) {
    throw unauthorizedError("Faça login para registrar o dispositivo.");
  }

  const { expoPushToken, platform } = parseTokenBody(await request.json());
  const pool = getPostgresPool();
  await upsertPushDeviceToken(pool, {
    userId: profile.userId,
    cpf: profile.cpf,
    expoPushToken,
    platform,
  });

  return apiSuccess({ ok: true as const });
});

export const DELETE = withDb(async (request) => {
  if (!isPostgresBackend()) {
    throw validationError("Push indisponível neste ambiente.");
  }

  const profile = await resolveProfileFromAuthorization(
    request.headers.get("Authorization")
  );
  if (!profile) {
    throw unauthorizedError("Faça login para remover o dispositivo.");
  }

  const { expoPushToken } = parseTokenBody(await request.json());
  const pool = getPostgresPool();
  await deletePushDeviceToken(pool, {
    userId: profile.userId,
    expoPushToken,
  });

  return apiSuccess({ ok: true as const });
});
