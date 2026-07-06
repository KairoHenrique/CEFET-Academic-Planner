export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { buildLegalMeta } from "@/lib/legal/constants";

export const runtime = "nodejs";

export const GET = async () => {
  return apiSuccess({ ok: true as const, ...buildLegalMeta() });
};
