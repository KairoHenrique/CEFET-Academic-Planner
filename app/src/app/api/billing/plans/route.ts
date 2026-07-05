export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { buildBillingPlansResponse } from "@/lib/billing/build-plans-response";

export const runtime = "nodejs";

export const GET = async () => {
  return apiSuccess(buildBillingPlansResponse());
};
