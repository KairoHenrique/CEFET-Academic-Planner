export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { requireDevOperator } from "@/lib/dev-panel/require-dev-operator";
import { getAppConfigJson, setAppConfigJson } from "@/lib/sync-policy/app-config-store";
import { appendDevAuditLog } from "@/lib/dev-panel/dev-audit-log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireDevOperator(request);
    const config = await getAppConfigJson("maintenance_policy");
    
    return apiSuccess({
      ok: true as const,
      policy: config ?? { enabled: false, pages: "/*", message: "Nosso site estará temporariamente indisponível para uma atualização do sistema. Voltaremos em breve!" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const operator = requireDevOperator(request);
    const body = await request.json();
    
    await setAppConfigJson("maintenance_policy", {
      enabled: Boolean(body.enabled),
      pages: typeof body.pages === "string" ? body.pages : "/*",
      message: typeof body.message === "string" ? body.message : "Manutenção."
    });

    await appendDevAuditLog({
      operatorEmail: operator.email,
      action: "UPDATE_MAINTENANCE_POLICY",
      detail: { enabled: body.enabled, pages: body.pages }
    });

    return apiSuccess({ ok: true as const });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
