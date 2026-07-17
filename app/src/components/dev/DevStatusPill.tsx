import type { ReactNode } from "react";

export type DevStatusTone = "ok" | "warn" | "danger" | "muted" | "info";

interface DevStatusPillProps {
  tone: DevStatusTone;
  children: ReactNode;
}

/** Badge de status reutilizável do painel dev (chaves, assinaturas, jobs). */
export function DevStatusPill({ tone, children }: DevStatusPillProps) {
  return (
    <span className={`dev-status-pill dev-status-pill--${tone}`}>{children}</span>
  );
}

const GIFT_KEY_TONES: Record<string, DevStatusTone> = {
  available: "ok",
  redeemed: "muted",
  revoked: "danger",
  expired: "warn",
};

export function giftKeyStatusTone(status: string): DevStatusTone {
  return GIFT_KEY_TONES[status] ?? "muted";
}

const SUBSCRIPTION_TONES: Record<string, DevStatusTone> = {
  active: "ok",
  trial_active: "info",
  pending_payment: "warn",
  trial_expired: "muted",
  expired: "muted",
  cancelled: "danger",
};

export function subscriptionStatusTone(status: string): DevStatusTone {
  return SUBSCRIPTION_TONES[status] ?? "muted";
}
