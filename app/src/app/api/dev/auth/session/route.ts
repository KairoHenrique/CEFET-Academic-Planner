export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireDevOperator(request);
    return apiSuccess({ ok: true as const, email: session.email });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
