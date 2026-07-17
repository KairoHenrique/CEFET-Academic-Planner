export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { clearSitePromo } from "@/lib/billing/site-promo/site-promo-store";
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
        planId: result.planId,
        promoPriceCents: result.promoPriceCents,
        discountPercent: result.discountPercent,
        expiresAt: result.expiresAt,
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

export async function DELETE(request: Request) {
  try {
    const session = requireDevOperator(request);
    await clearSitePromo();

    await appendDevAuditLog({
      operatorEmail: session.email,
      action: "dev.promotions.clear_site",
      detail: {},
    });

    return apiSuccess({ ok: true as const, cleared: true as const });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
