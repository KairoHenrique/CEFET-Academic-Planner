import "server-only";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import {
  buildSigaaResumoFromReader,
  SIGAA_CH_KEYS,
  type SigaaIntegralizacaoResumo,
} from "@/lib/integralizacao/sigaa-ch-config";

/**
 * Lê o resumo de integralização (`sigaa.ch.*`) da tabela Postgres
 * `configuracoes` escopada por tenant. Substitui a leitura SQLite `getConfig`
 * no deploy cloud/postgres (uma única query — sem N+1 por chave).
 */
export async function pgReadSigaaIntegralizacaoResumo(): Promise<SigaaIntegralizacaoResumo> {
  const userId = getActiveTenantUserId();
  if (!userId) {
    return buildSigaaResumoFromReader(() => null);
  }

  const result = await getPostgresPool().query<{ chave: string; valor: string }>(
    `SELECT chave, valor
     FROM configuracoes
     WHERE user_id = $1 AND chave = ANY($2::text[])`,
    [userId, [...SIGAA_CH_KEYS]]
  );

  const byKey = new Map(result.rows.map((row) => [row.chave, row.valor]));
  return buildSigaaResumoFromReader((chave) => byKey.get(chave) ?? null);
}
