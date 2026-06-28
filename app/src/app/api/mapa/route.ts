import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { buildMapa } from "@/lib/mapa/build-mapa";

export const GET = withDb(async () => {
  const mapa = buildMapa();
  return apiSuccess(mapa);
});
