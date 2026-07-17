import { useMemo } from "react";
import type { SitePromoPublic } from "@/lib/types/billing-api";

interface PlanosPromoBannerProps {
  promo: SitePromoPublic;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function resolveDeadlineLabel(expiresAt: string | null): string | null {
  if (!expiresAt) {
    return null;
  }

  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) {
    return null;
  }

  const daysLeft = Math.ceil((target - Date.now()) / DAY_MS);
  if (daysLeft <= 0) {
    return null;
  }
  if (daysLeft === 1) {
    return "Termina hoje";
  }
  if (daysLeft <= 7) {
    return `Termina em ${daysLeft} dias`;
  }

  const formatted = new Date(target).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `Válido até ${formatted}`;
}

export function PlanosPromoBanner({ promo }: PlanosPromoBannerProps) {
  const deadlineLabel = useMemo(
    () => resolveDeadlineLabel(promo.expiresAt),
    [promo.expiresAt]
  );

  return (
    <aside className="planos-promo" role="note" aria-label="Promoção ativa">
      <span className="planos-promo-glow" aria-hidden="true" />

      <div className="planos-promo-badge">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l2.4 5.3L20 8l-4 3.9L17 18l-5-2.8L7 18l1-6.1L4 8l5.6-.7L12 2z" />
        </svg>
        {promo.badge ?? "Oferta"}
      </div>

      <div className="planos-promo-body">
        <p className="planos-promo-title">{promo.headline}</p>
        <p className="planos-promo-copy">{promo.description}</p>
      </div>

      {deadlineLabel ? (
        <span className="planos-promo-deadline">{deadlineLabel}</span>
      ) : null}
    </aside>
  );
}
