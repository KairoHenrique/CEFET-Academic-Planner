import { resolvePlanDurationDays } from "@/lib/billing/plan-catalog";
import {
  DEFAULT_PLAY_PRICES_CENTS,
  PLAY_PRODUCT_SKU,
} from "@/lib/billing/default-play-prices";
import { insertActivePlaySubscription } from "@/lib/billing/checkout/billing-subscription-repository";
import { computePaidSubscriptionExpiresAt } from "@/lib/billing/subscription/compute-subscription-expires-at";
import type { PaidPlanId } from "@/lib/billing/types";
import { validationError } from "@/lib/api/errors";
import { getPostgresPool } from "@/lib/db/postgres/pool";

function skuToPlanId(sku: string): PaidPlanId | null {
  const trimmed = sku.trim();
  for (const [planId, productSku] of Object.entries(PLAY_PRODUCT_SKU)) {
    if (productSku === trimmed) return planId as PaidPlanId;
  }
  return null;
}

/**
 * Verifica compra Play Billing e ativa ads_free.
 *
 * Producao: exige GOOGLE_PLAY_PACKAGE_NAME + GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
 * (Android Publisher API). Em desenvolvimento, PLAY_BILLING_DEV_ACCEPT=1
 * aceita token nao-vazio (apenas para testes internos).
 */
export async function verifyAndActivatePlayPurchase(input: {
  userId: string;
  cpf: string;
  productId: string;
  purchaseToken: string;
}): Promise<{
  ok: true;
  adsFree: true;
  planId: PaidPlanId;
  expiresAt: string;
  reused: boolean;
}> {
  const planId = skuToPlanId(input.productId);
  if (!planId || DEFAULT_PLAY_PRICES_CENTS[planId] == null) {
    throw validationError("Produto Play invalido para remocao de anuncios.");
  }

  const token = input.purchaseToken.trim();
  if (!token) {
    throw validationError("purchaseToken obrigatorio.");
  }

  const pool = getPostgresPool();
  const dedupeKey = `play.purchase.${input.userId}.${token.slice(0, 64)}`;
  const dedupe = await pool.query<{ valor: unknown }>(
    `SELECT valor FROM app_config WHERE chave = $1 LIMIT 1`,
    [dedupeKey]
  );
  if (dedupe.rows[0]?.valor) {
    try {
      const raw = dedupe.rows[0].valor;
      const parsed = (
        typeof raw === "string" ? JSON.parse(raw) : raw
      ) as {
        planId: PaidPlanId;
        expiresAt: string;
      };
      return {
        ok: true,
        adsFree: true,
        planId: parsed.planId,
        expiresAt: parsed.expiresAt,
        reused: true,
      };
    } catch {
      /* continue */
    }
  }

  await assertPlayPurchaseValid({
    packageName:
      process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "br.cefethub.acme",
    productId: input.productId,
    purchaseToken: token,
  });

  const durationDays = resolvePlanDurationDays(planId);
  const expiresAt = await computePaidSubscriptionExpiresAt({
    userId: input.userId,
    durationDays,
  });

  const subscription = await insertActivePlaySubscription({
    userId: input.userId,
    planId,
    expiresAt,
  });

  await pool.query(
    `INSERT INTO app_config (chave, valor, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now()`,
    [
      dedupeKey,
      JSON.stringify({
        planId,
        expiresAt: subscription.expires_at,
        productId: input.productId,
      }),
    ]
  );

  return {
    ok: true,
    adsFree: true,
    planId,
    expiresAt: subscription.expires_at,
    reused: false,
  };
}

async function assertPlayPurchaseValid(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<void> {
  const saJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!saJson) {
    if (process.env.PLAY_BILLING_DEV_ACCEPT === "1") {
      return;
    }
    throw validationError(
      "Play Billing nao configurado no servidor (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)."
    );
  }

  // Validacao via Android Publisher API (subscriptions v2 ou products).
  // Usa access token obtido do service account (JWT).
  const { GoogleAuth } = await import("google-auth-library").catch(() => ({
    GoogleAuth: null as unknown as typeof import("google-auth-library").GoogleAuth,
  }));
  if (!GoogleAuth) {
    if (process.env.PLAY_BILLING_DEV_ACCEPT === "1") return;
    throw validationError(
      "Dependencia google-auth-library ausente para validar Play Billing."
    );
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(saJson) as Record<string, unknown>;
  } catch {
    throw validationError("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON invalido.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw validationError("Falha ao autenticar no Google Play API.");
  }

  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(input.packageName)}/purchases/products/` +
    `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken.token}` },
  });
  if (!response.ok) {
    // Tenta endpoint de subscription
    const subUrl =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
      `${encodeURIComponent(input.packageName)}/purchases/subscriptions/` +
      `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;
    const subRes = await fetch(subUrl, {
      headers: { authorization: `Bearer ${accessToken.token}` },
    });
    if (!subRes.ok) {
      throw validationError("Compra Play nao reconhecida pela Google.");
    }
  }
}
