export const dynamic = "force-dynamic";

import {
  invalidCredentialsError,
} from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import {
  assertDevOperatorsConfigured,
  verifyDevOperatorCredentials,
} from "@/lib/dev-panel/operator-registry";
import {
  buildDevSessionSetCookie,
  createDevOperatorSession,
} from "@/lib/dev-panel/operator-session";
import { parseDevLoginRequest } from "@/lib/dev-panel/parse-dev-requests";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertDevOperatorsConfigured();
    const body = await request.json();
    const input = parseDevLoginRequest(body);
    const operator = verifyDevOperatorCredentials(input);

    if (!operator) {
      return apiErrorResponse(
        invalidCredentialsError("Credenciais inválidas.")
      );
    }

    const { token, session } = createDevOperatorSession(operator.email);
    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.login",
    });

    const response = apiSuccess({ ok: true as const, email: session.email });
    response.headers.append("Set-Cookie", buildDevSessionSetCookie(token));
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
