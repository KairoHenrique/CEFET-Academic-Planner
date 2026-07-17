import { validationError } from "@/lib/api/errors";
import { PAID_PLAN_IDS } from "@/lib/billing/plan-catalog";
import type { PaidPlanId } from "@/lib/billing/types";
import type {
  DevGrantSubscriptionRequest,
  DevPromotionRequest,
  DevRobotRunRequest,
  DevRobotsSelection,
} from "@/lib/dev-panel/types";
import type { SyncPolicyOverrides } from "@/lib/sync-policy/types";

/** Limite defensivo: ~100 anos, evita overflow de data mantendo liberdade. */
const MAX_GRANT_DAYS = 36_500;

/** Teto de preço promocional (R$ 100.000) — evita valores absurdos. */
const MAX_PROMO_PRICE_CENTS = 10_000_000;
const MAX_PROMO_DURATION_DAYS = 365;

function parseRobots(value: unknown): DevRobotsSelection {
  if (!value || typeof value !== "object") {
    throw validationError("Campo robots é obrigatório.");
  }

  const record = value as Record<string, unknown>;
  const selection: DevRobotsSelection = {
    r1: record.r1 === true,
    r2: record.r2 === true,
    r3: record.r3 === true,
  };

  if (!selection.r1 && !selection.r2 && !selection.r3) {
    throw validationError("Selecione ao menos um robô (R1, R2 ou R3).");
  }

  return selection;
}

export function parseDevRobotRunRequest(body: unknown): DevRobotRunRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const scope = record.scope;
  if (scope !== "individual" && scope !== "global") {
    throw validationError('Campo scope deve ser "individual" ou "global".');
  }

  const accountRef =
    typeof record.accountRef === "string" ? record.accountRef.trim() : undefined;
  if (scope === "individual" && !accountRef) {
    throw validationError(
      "Informe accountRef válido para escopo individual."
    );
  }

  const modeRaw = record.mode;
  const mode =
    modeRaw === "full" || modeRaw === "lite" || modeRaw === "deep"
      ? modeRaw
      : "deep";

  return {
    scope,
    accountRef,
    robots: parseRobots(record.robots),
    mode,
  };
}

export function parseDevGrantSubscriptionRequest(
  body: unknown
): DevGrantSubscriptionRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;

  const accountRef =
    typeof record.accountRef === "string" ? record.accountRef.trim() : "";
  if (!accountRef) {
    throw validationError("Selecione uma conta para conceder o plano.");
  }

  const planId =
    typeof record.planId === "string" ? record.planId.trim() : "";
  if (!(PAID_PLAN_IDS as readonly string[]).includes(planId)) {
    throw validationError("Plano inválido.", { planId });
  }

  const days = Number(record.days);
  if (!Number.isInteger(days) || days < 1 || days > MAX_GRANT_DAYS) {
    throw validationError(
      `Dias deve ser inteiro entre 1 e ${MAX_GRANT_DAYS}.`
    );
  }

  return { accountRef, planId: planId as PaidPlanId, days };
}

export function parseDevPromotionRequest(body: unknown): DevPromotionRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;

  const planId = typeof record.planId === "string" ? record.planId.trim() : "";
  if (!(PAID_PLAN_IDS as readonly string[]).includes(planId)) {
    throw validationError("Plano inválido.", { planId });
  }

  const promoPriceCents = Number(record.promoPriceCents);
  if (
    !Number.isInteger(promoPriceCents) ||
    promoPriceCents < 1 ||
    promoPriceCents > MAX_PROMO_PRICE_CENTS
  ) {
    throw validationError(
      "Preço promocional deve ser um valor inteiro em centavos maior que zero."
    );
  }

  const durationDays = Number(record.durationDays);
  if (
    !Number.isInteger(durationDays) ||
    durationDays < 1 ||
    durationDays > MAX_PROMO_DURATION_DAYS
  ) {
    throw validationError(
      `Duração deve ser inteiro entre 1 e ${MAX_PROMO_DURATION_DAYS} dias.`
    );
  }

  return {
    planId: planId as PaidPlanId,
    promoPriceCents,
    durationDays,
  };
}

export function parseDevLoginRequest(body: unknown): {
  email: string;
  password: string;
} {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    throw validationError("Informe e-mail e senha do operador.");
  }

  return { email, password };
}

export function parseSyncPolicyPatchBody(body: unknown): SyncPolicyOverrides {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw validationError("Policy deve ser um objeto JSON.");
  }

  return body as SyncPolicyOverrides;
}
