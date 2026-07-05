export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import {
  buildDevSessionClearCookie,
  readDevOperatorSessionFromCookie,
} from "@/lib/dev-panel/operator-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = readDevOperatorSessionFromCookie(
      request.headers.get("cookie")
    );

    if (session) {
      await appendDevAuditLog({
        operatorEmail: session.email,
        action: "dev.logout",
      });
    }

    const response = apiSuccess({ ok: true as const });
    response.headers.append("Set-Cookie", buildDevSessionClearCookie());
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
