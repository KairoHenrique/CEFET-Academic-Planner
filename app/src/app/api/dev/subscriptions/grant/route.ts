export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { grantDevSubscription } from "@/lib/dev-panel/grant-dev-subscription";
import { parseDevGrantSubscriptionRequest } from "@/lib/dev-panel/parse-dev-requests";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    const body = await request.json();
    const input = parseDevGrantSubscriptionRequest(body);
    const result = await grantDevSubscription(input);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.subscription.grant",
      detail: {
        cpfLast4: result.cpfLast4,
        planId: result.planId,
        days: result.subscription.daysGranted,
        expiresAt: result.subscription.expiresAt,
      },
    });

    return apiSuccess({ ok: true as const, ...result }, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
