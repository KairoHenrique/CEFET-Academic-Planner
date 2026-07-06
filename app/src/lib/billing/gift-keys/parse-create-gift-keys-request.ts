import { validationError } from "@/lib/api/errors";
import { PAID_PLAN_IDS } from "@/lib/billing/plan-catalog";
import { resolvePlanDurationDays } from "@/lib/billing/plan-catalog";
import type { PaidPlanId } from "@/lib/billing/types";

function isPaidPlanId(value: string): value is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(value);
}

export interface CreateGiftKeysInput {
  planId: PaidPlanId;
  count: number;
  durationDays: number;
  internalLabel: string | null;
  keyExpiresAt: string | null;
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

function parseCount(raw: unknown): number {
  const value = raw == null ? 1 : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw validationError("count deve ser inteiro entre 1 e 50.");
  }
  return value;
}

function parseDurationDays(raw: unknown, planId: PaidPlanId): number {
  if (raw == null || raw === "") {
    return resolvePlanDurationDays(planId);
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw validationError("durationDays inválido.");
  }

  return value;
}

function parseOptionalLabel(raw: unknown): string | null {
  if (raw == null || raw === "") {
    return null;
  }

  if (typeof raw !== "string") {
    throw validationError("internalLabel deve ser string.");
  }

  const label = raw.trim();
  return label || null;
}

function parseOptionalIsoDate(raw: unknown): string | null {
  if (raw == null || raw === "") {
    return null;
  }

  if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
    throw validationError("keyExpiresAt inválido.");
  }

  return new Date(raw).toISOString();
}

export function parseCreateGiftKeysRequest(body: unknown): CreateGiftKeysInput {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const record = body as Record<string, unknown>;
  const planId = parsePlanId(record.planId);

  return {
    planId,
    count: parseCount(record.count),
    durationDays: parseDurationDays(record.durationDays, planId),
    internalLabel: parseOptionalLabel(record.internalLabel),
    keyExpiresAt: parseOptionalIsoDate(record.keyExpiresAt),
  };
}
