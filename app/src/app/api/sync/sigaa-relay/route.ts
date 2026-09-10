export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError, unauthorizedError, validationError } from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { SIGAA_BASE_URL } from "@/lib/scraper/sigaa-urls";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_HOST = "sig.cefetmg.br";
const MAX_BODY_BYTES = 256_000;

function assertAllowedSigaaUrl(urlRaw: string): URL {
  let url: URL;
  try {
    url = new URL(urlRaw);
  } catch {
    throw validationError("URL inválida para o relay SIGAA.");
  }

  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) {
    throw validationError("Relay só permite https://sig.cefetmg.br/…");
  }

  if (!url.pathname.startsWith("/sigaa")) {
    throw validationError("Path do relay fora de /sigaa.");
  }

  return url;
}

/**
 * Relay HTTP autenticado para o sync no browser (CORS).
 * Nota: `fetch()` do Workers falha TLS no SIGAA (526). Não importar `node:tls`
 * neste Worker OpenNext — estoura cold start (Error 1102). Proxy TLS separado TBD.
 */
export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError("Relay SIGAA só no deploy cloud.");
    }

    await ensurePostgresReady();
    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError("Faça login para usar o relay SIGAA.");
    }
    await enforceSubscriptionAccessGate(profile);

    const body = (await request.json()) as Record<string, unknown>;
    const url = assertAllowedSigaaUrl(
      typeof body.url === "string" ? body.url : SIGAA_BASE_URL
    );
    const method =
      typeof body.method === "string" && body.method.trim()
        ? body.method.trim().toUpperCase()
        : "GET";
    if (method !== "GET" && method !== "POST") {
      throw validationError("Relay aceita apenas GET ou POST.");
    }

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (compatible; ACMEHubSigaaRelay/1.0; +https://acme-hub)",
    };
    if (typeof body.cookie === "string" && body.cookie.trim()) {
      headers.Cookie = body.cookie.trim();
    }
    if (typeof body.contentType === "string" && body.contentType.trim()) {
      headers["Content-Type"] = body.contentType.trim();
    }
    if (typeof body.referer === "string" && body.referer.trim()) {
      headers.Referer = body.referer.trim();
    }

    let requestBody: string | undefined;
    if (method === "POST") {
      if (typeof body.body !== "string") {
        throw validationError("body string obrigatório no POST do relay.");
      }
      if (body.body.length > MAX_BODY_BYTES) {
        throw validationError("Body do relay muito grande.");
      }
      requestBody = body.body;
    }

    const upstream = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
      redirect: "manual",
    });

    const setCookie =
      typeof (
        upstream.headers as Headers & { getSetCookie?: () => string[] }
      ).getSetCookie === "function"
        ? (
            upstream.headers as Headers & { getSetCookie: () => string[] }
          ).getSetCookie()
        : upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : [];

    const text = await upstream.text();
    const location = upstream.headers.get("location");

    return apiSuccess({
      ok: true as const,
      status: upstream.status,
      url: upstream.url || url.toString(),
      location,
      setCookie,
      body: text,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};
