"use client";

import { useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type { SitePromoPublic } from "@/lib/types/billing-api";
import { formatBrlCents } from "@/lib/billing/format-brl-cents";
import { useDevClearSitePromo } from "@/hooks/useDevPanel";

interface DevActivePromoCardProps {
  promo: SitePromoPublic;
}

function formatDate(iso: string): string {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed)
    ? "—"
    : new Date(parsed).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

export function DevActivePromoCard({ promo }: DevActivePromoCardProps) {
  const clearMutation = useDevClearSitePromo();
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    setError(null);
    try {
      await clearMutation.mutateAsync();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Falha ao encerrar a promoção."
      );
    }
  }

  return (
    <div className="dev-active-promo">
      <div className="dev-active-promo-head">
        <span className="dev-active-promo-badge">-{promo.discountPercent}%</span>
        <div>
          <p className="dev-active-promo-title">{promo.headline}</p>
          <p className="dev-table-meta">
            De <s>{formatBrlCents(promo.basePriceCents)}</s> por{" "}
            {formatBrlCents(promo.promoPriceCents)} · termina em{" "}
            {formatDate(promo.expiresAt)}
          </p>
        </div>
      </div>

      <div className="dev-active-promo-actions">
        <button
          type="button"
          className="btn-outline btn-danger dev-action-btn"
          disabled={clearMutation.isPending}
          onClick={() => void handleClear()}
        >
          {clearMutation.isPending ? "Encerrando…" : "Encerrar promoção agora"}
        </button>
        {error ? (
          <span className="form-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
