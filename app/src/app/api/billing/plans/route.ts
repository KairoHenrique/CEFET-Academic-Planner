export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { buildBillingPlansResponse } from "@/lib/billing/build-plans-response";
import { applyActiveSitePromo } from "@/lib/billing/site-promo/apply-site-promo-to-plans";

export const runtime = "nodejs";

export const GET = async () => {
  const base = buildBillingPlansResponse();
  const withPromo = await applyActiveSitePromo(base);
  return apiSuccess(withPromo);
};
