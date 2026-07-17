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

const PROMO_HEADLINE_MIN = 3;
const PROMO_HEADLINE_MAX = 120;
const PROMO_MESSAGE_MIN = 3;
const PROMO_MESSAGE_MAX = 2_000;

/** Remove caracteres de controle (exceto quebras de linha) do conteúdo do e-mail. */
function sanitizePromotionText(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

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

  const scope = record.scope;
  if (scope !== "individual" && scope !== "global") {
    throw validationError('Campo scope deve ser "individual" ou "global".');
  }

  const accountRef =
    typeof record.accountRef === "string" ? record.accountRef.trim() : undefined;
  if (scope === "individual" && !accountRef) {
    throw validationError("Selecione uma conta para o disparo individual.");
  }

  const headline =
    typeof record.headline === "string"
      ? sanitizePromotionText(record.headline)
      : "";
  if (headline.length < PROMO_HEADLINE_MIN || headline.length > PROMO_HEADLINE_MAX) {
    throw validationError(
      `Título deve ter entre ${PROMO_HEADLINE_MIN} e ${PROMO_HEADLINE_MAX} caracteres.`
    );
  }

  const message =
    typeof record.message === "string"
      ? sanitizePromotionText(record.message)
      : "";
  if (message.length < PROMO_MESSAGE_MIN || message.length > PROMO_MESSAGE_MAX) {
    throw validationError(
      `Mensagem deve ter entre ${PROMO_MESSAGE_MIN} e ${PROMO_MESSAGE_MAX} caracteres.`
    );
  }

  return { scope, accountRef, headline, message };
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
