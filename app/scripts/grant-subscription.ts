/**
 * Concede uma assinatura ativa a uma conta (uso operacional/admin).
 *
 * Uso:
 *   npm run grant:sub -- --cpf=00000000000 --plan=five_year
 *
 * Requer app/.env.local com DATABASE_URL (Supabase Session pooler).
 * Não commitar credenciais. Queries 100% parametrizadas (sem SQL injection).
 */
import { Client } from "pg";

type PaidPlanId = "month" | "quarter" | "semester" | "year" | "five_year";

const VALID_PLANS: readonly PaidPlanId[] = [
  "month",
  "quarter",
  "semester",
  "year",
  "five_year",
];

function parseArg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : null;
}

function normalizeCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) {
    throw new Error(`CPF inválido (esperado 11 dígitos): "${raw}"`);
  }
  return digits;
}

function parsePlan(raw: string | null): PaidPlanId {
  const plan = (raw ?? "five_year").trim();
  if (!VALID_PLANS.includes(plan as PaidPlanId)) {
    throw new Error(`Plano inválido: "${plan}". Use um de: ${VALID_PLANS.join(", ")}`);
  }
  return plan as PaidPlanId;
}

async function main(): Promise<void> {
  const cpf = normalizeCpf(parseArg("cpf") ?? "");
  const planId = parsePlan(parseArg("plan"));

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 10_000 });
  await client.connect();

  try {
    const profile = await client.query<{ user_id: string; email: string }>(
      `SELECT user_id, email FROM app_profiles WHERE cpf = $1 LIMIT 1`,
      [cpf]
    );
    const account = profile.rows[0];
    if (!account) {
      throw new Error(`Nenhuma conta encontrada para o CPF informado.`);
    }

    const plan = await client.query<{ duration_days: number; label: string }>(
      `SELECT duration_days, label FROM plans WHERE id = $1 LIMIT 1`,
      [planId]
    );
    const planRow = plan.rows[0];
    if (!planRow) {
      throw new Error(`Plano "${planId}" não encontrado na tabela plans.`);
    }

    await client.query("BEGIN");

    const inserted = await client.query<{ id: string; expires_at: Date }>(
      `INSERT INTO subscriptions (user_id, plan_id, status, source, expires_at)
       VALUES ($1, $2, 'active', 'manual', now() + ($3 || ' days')::interval)
       RETURNING id, expires_at`,
      [account.user_id, planId, String(planRow.duration_days)]
    );
    const subscription = inserted.rows[0];

    await client.query(
      `UPDATE subscriptions
       SET status = 'expired', updated_at = now()
       WHERE user_id = $1 AND status = 'active' AND id <> $2`,
      [account.user_id, subscription.id]
    );

    await client.query("COMMIT");

    console.log("Assinatura concedida:");
    console.log(`  conta      : ${account.email} (user_id ${account.user_id})`);
    console.log(`  plano      : ${planId} — ${planRow.label} (${planRow.duration_days} dias)`);
    console.log(`  subscription: ${subscription.id}`);
    console.log(`  expira em  : ${subscription.expires_at.toISOString()}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha ao conceder assinatura: ${message}`);
  process.exit(1);
});
