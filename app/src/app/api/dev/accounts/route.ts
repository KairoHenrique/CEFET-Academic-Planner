export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { listDevAccounts } from "@/lib/dev-panel/list-dev-accounts";
import { toDevAccountPublicViews } from "@/lib/dev-panel/sanitize-dev-account";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireDevOperator(request);
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? undefined;
    const accounts = await listDevAccounts(query);

    return apiSuccess({ ok: true as const, accounts: toDevAccountPublicViews(accounts) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
