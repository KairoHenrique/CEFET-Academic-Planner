import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { DevOperatorSession } from "@/lib/dev-panel/types";

export const DEV_SESSION_COOKIE = "planner_dev_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function resolveSessionSecret(): string {
  const secret =
    process.env.PLANNER_DEV_SESSION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();

  if (!secret) {
    throw new Error(
      "PLANNER_DEV_SESSION_SECRET, CRON_SECRET ou CREDENTIALS_ENCRYPTION_KEY é obrigatório para sessão dev."
    );
  }

  return secret;
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", resolveSessionSecret())
    .update(payloadB64)
    .digest("base64url");
}

function encodeSession(session: DevOperatorSession): string {
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

function decodeSession(token: string): DevOperatorSession | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return null;
  }

  const expected = signPayload(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as DevOperatorSession;

    if (!parsed.email?.trim() || !parsed.expiresAt?.trim()) {
      return null;
    }

    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createDevOperatorSession(email: string): {
  token: string;
  session: DevOperatorSession;
} {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_SECONDS * 1000);
  const session: DevOperatorSession = {
    email: email.toLowerCase(),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  return {
    session,
    token: encodeSession(session),
  };
}

export function readDevOperatorSessionFromCookie(
  cookieHeader: string | null | undefined
): DevOperatorSession | null {
  if (!cookieHeader?.trim()) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith(`${DEV_SESSION_COOKIE}=`)) {
      continue;
    }
    const token = part.slice(DEV_SESSION_COOKIE.length + 1);
    return decodeSession(decodeURIComponent(token));
  }

  return null;
}

export function buildDevSessionSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${DEV_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function buildDevSessionClearCookie(): string {
  return `${DEV_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function newDevAuditId(): string {
  return randomBytes(8).toString("hex");
}
