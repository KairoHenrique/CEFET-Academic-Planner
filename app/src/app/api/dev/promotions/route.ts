export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { dispatchPromotion } from "@/lib/dev-panel/dispatch-promotion";
import { parseDevPromotionRequest } from "@/lib/dev-panel/parse-dev-requests";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    const body = await request.json();
    const input = parseDevPromotionRequest(body);
    const result = await dispatchPromotion(input);

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.promotions.dispatch",
      detail: {
        scope: input.scope,
        campaignId: result.campaignId,
        targets: result.targets,
        queued: result.queued,
        sent: result.sent,
        failed: result.failed,
      },
    });

    return apiSuccess({ ok: true as const, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
