import { isCloudDeployment } from "@/lib/db/backend/config";

/**
 * No Cloudflare Workers, conexões PG não podem “vazar” entre requests.
 * Este helper só documenta o escopo: a lógica real está em `getPostgresPool()`
 * (CloudRequestPool cria client por operação). Mantém a API usada pelos crons.
 */
export async function withCloudPostgresClient<T>(
  run: () => Promise<T>
): Promise<T> {
  if (!isCloudDeployment()) {
    return run();
  }
  return run();
}
