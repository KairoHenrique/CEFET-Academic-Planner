import { validationError } from "@/lib/api/errors";
import { PAID_PLAN_IDS } from "@/lib/billing/plan-catalog";
import type { PaidPlanId } from "@/lib/billing/types";

const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

export interface ParsedBillingCheckoutRequest {
  planId: PaidPlanId;
  idempotencyKey: string | null;
}

function isPaidPlanId(value: string): value is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(value);
}

function parsePlanId(raw: unknown): PaidPlanId {
  if (typeof raw !== "string" || !raw.trim()) {
    throw validationError("Campo planId é obrigatório.");
  }

  const planId = raw.trim();
  if (!isPaidPlanId(planId)) {
    throw validationError("Plano inválido.", { planId });
  }

  return planId;
}

function parseIdempotencyKey(raw: unknown): string | null {
  if (raw == null || raw === "") {
    return null;
  }

  if (typeof raw !== "string") {
    throw validationError("idempotencyKey deve ser uma string.");
  }

  const key = raw.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw validationError(
      "idempotencyKey inválida (8–128 caracteres alfanuméricos, _ ou -)."
    );
  }

  return key;
}

export function parseBillingCheckoutRequest(
  body: unknown
): ParsedBillingCheckoutRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const record = body as Record<string, unknown>;

  return {
    planId: parsePlanId(record.planId),
    idempotencyKey: parseIdempotencyKey(record.idempotencyKey),
  };
}

export function readIdempotencyKeyFromHeaders(
  request: Request
): string | null {
  const header = request.headers.get("Idempotency-Key");
  if (!header?.trim()) {
    return null;
  }

  return parseIdempotencyKey(header);
}
