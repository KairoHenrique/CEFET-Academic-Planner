export const dynamic = "force-dynamic";
import {
  allowCalendarFeedRequest,
  CALENDAR_FEED_MAX_PER_IP,
  CALENDAR_FEED_MAX_PER_TOKEN,
  resolveCalendarFeedClientKey,
  resolveCalendarFeedTokenKey,
} from "@/lib/calendar-sync/calendar-feed-rate-limit";
import { serveCalendarFeed } from "@/lib/calendar-sync/serve-calendar-feed";

type RouteContext = { params: Promise<{ token: string }> };

function tooManyRequests(): Response {
  return new Response("Muitas requisições.", {
    status: 429,
    headers: { "Retry-After": "60", "Cache-Control": "no-store" },
  });
}

/** Feed .ics público (assinado pelo Google Agenda): o token na URL é a credencial. */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { token } = await context.params;
  if (
    !allowCalendarFeedRequest(resolveCalendarFeedClientKey(request), CALENDAR_FEED_MAX_PER_IP) ||
    !allowCalendarFeedRequest(resolveCalendarFeedTokenKey(token), CALENDAR_FEED_MAX_PER_TOKEN)
  ) {
    return tooManyRequests();
  }
  return serveCalendarFeed(token);
}
