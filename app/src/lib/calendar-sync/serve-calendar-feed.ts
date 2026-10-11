import { ApiError } from "@/lib/api/errors";
import { findProfileByUserId } from "@/lib/auth/account/profile-repository";
import { runWithQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import {
  hashCalendarFeedToken,
  isWellFormedCalendarFeedToken,
} from "@/lib/calendar-sync/calendar-feed-token";
import { loadCalendarSyncItems } from "@/lib/calendar-sync/load-calendar-sync-items";
import { renderIcsCalendar } from "@/lib/calendar-sync/render-ics-calendar";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { isPostgresBackend } from "@/lib/db/backend/config";
import {
  pgFindCalendarFeedOwnerByTokenHash,
  pgTouchCalendarFeedAccess,
} from "@/lib/db/postgres/calendar-sync-settings";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { runWithTenantUserId } from "@/lib/db/postgres/tenant-context";
import { logSafeError } from "@/lib/security/safe-log";

const CALENDAR_NAME = "ACME HUB — Agenda acadêmica";

function plainResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function icsResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="acme-hub.ics"',
      "Cache-Control": "private, max-age=900",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}

async function buildFeedForToken(token: string): Promise<Response> {
  await ensurePostgresReady();
  const owner = await pgFindCalendarFeedOwnerByTokenHash(await hashCalendarFeedToken(token));
  if (!owner) return plainResponse(404, "Agenda não encontrada.");

  const profile = await findProfileByUserId(owner.userId);
  try {
    await enforceSubscriptionAccessGate(profile);
  } catch (error) {
    if (error instanceof ApiError) return plainResponse(403, "Acesso à agenda indisponível.");
    throw error;
  }

  const items = await runWithQueryCursoId(profile?.cursoId, () =>
    runWithTenantUserId(owner.userId, () => loadCalendarSyncItems(owner.preferences))
  );
  void pgTouchCalendarFeedAccess(owner.userId).catch(() => undefined);
  return icsResponse(renderIcsCalendar(items, { calendarName: CALENDAR_NAME }));
}

/** Respostas genéricas: nunca revelam se o token existiu ou detalhes internos. */
export async function serveCalendarFeed(rawToken: string): Promise<Response> {
  const token = rawToken.replace(/\.ics$/i, "");
  if (!isWellFormedCalendarFeedToken(token)) return plainResponse(404, "Agenda não encontrada.");
  if (!isPostgresBackend()) return plainResponse(503, "Indisponível.");

  try {
    return await withCloudPostgresClient(() => buildFeedForToken(token));
  } catch (error) {
    logSafeError("[calendar-feed] falha ao gerar feed", error);
    return plainResponse(500, "Erro ao gerar a agenda.");
  }
}
