export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { parsePatchPerfilBody } from "@/lib/api/validate";
import { withDb } from "@/lib/api/with-db";
import { buildPerfil } from "@/lib/perfil/build-perfil";
import { patchPerfil } from "@/lib/perfil/patch-perfil";

export const runtime = "nodejs";

export const GET = withDb(async () => {
  return apiSuccess(buildPerfil());
});

export const PATCH = withDb(async (request) => {
  const body = parsePatchPerfilBody(await request.json());
  return apiSuccess(patchPerfil(body));
});
