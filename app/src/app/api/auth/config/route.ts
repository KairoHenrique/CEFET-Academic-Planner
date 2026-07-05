export const dynamic = "force-dynamic";

import { apiSuccess } from "@/lib/api/response";
import { APP_CURSO_IDS, resolveCursoLabel } from "@/lib/auth/account/curso-catalog";
import { isCloudAccountAuthConfigured } from "@/lib/auth/account/cloud-auth-guard";

export const runtime = "nodejs";

export const GET = async () => {
  const cloud = isCloudAccountAuthConfigured();

  return apiSuccess({
    ok: true as const,
    mode: cloud ? ("cloud" as const) : ("sigaa" as const),
    cursos: cloud
      ? APP_CURSO_IDS.map((id) => ({
          id,
          label: resolveCursoLabel(id),
        }))
      : [],
  });
};
