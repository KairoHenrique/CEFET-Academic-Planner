import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildPerfil } from "@/lib/perfil/build-perfil";

export const runtime = "nodejs";

export const GET = withDb(async () => {
  return apiSuccess(buildPerfil());
});
