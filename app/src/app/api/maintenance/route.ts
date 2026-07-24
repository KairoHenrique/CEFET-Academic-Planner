export const dynamic = "force-dynamic";
export const revalidate = 60;

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { getAppConfigJson } from "@/lib/sync-policy/app-config-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = await getAppConfigJson("maintenance_policy");
    
    return apiSuccess({
      ok: true as const,
      policy: config ?? { enabled: false, pages: "/*", message: "Nosso site estará temporariamente indisponível para uma atualização do sistema. Voltaremos em breve!" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
