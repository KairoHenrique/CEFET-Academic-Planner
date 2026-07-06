export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";
import { createGiftKeysBatch } from "@/lib/billing/gift-keys/create-gift-keys-batch";
import { listGiftKeys } from "@/lib/billing/gift-keys/gift-key-repository";
import { parseCreateGiftKeysRequest } from "@/lib/billing/gift-keys/parse-create-gift-keys-request";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireDevOperator(request);
    await ensurePostgresReady();

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const keys = await listGiftKeys(limit);

    return apiSuccess({ ok: true as const, keys });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = requireDevOperator(request);
    await ensurePostgresReady();

    const body = await request.json();
    const input = parseCreateGiftKeysRequest(body);
    const result = await createGiftKeysBatch(input, session.email);

    appendDevAuditLog({
      action: "gift_keys.create",
      operatorEmail: session.email,
      detail: {
        count: result.count,
        planId: input.planId,
        internalLabel: input.internalLabel,
      },
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
