export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { buildPixGatewayStatusResponse } from "@/lib/billing/gateway/build-gateway-status-response";

export const runtime = "nodejs";

export const GET = async () => {
  return apiSuccess(buildPixGatewayStatusResponse());
};
