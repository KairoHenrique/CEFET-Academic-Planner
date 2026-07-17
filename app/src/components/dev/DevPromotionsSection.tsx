"use client";

import { useBillingPlans } from "@/hooks/useBillingPlans";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import { DevActivePromoCard } from "@/components/dev/DevActivePromoCard";
import { DevPromotionForm } from "@/components/dev/DevPromotionForm";
import { DevPromotionPriceTable } from "@/components/dev/DevPromotionPriceTable";

export function DevPromotionsSection() {
  const plansQuery = useBillingPlans();
  const catalog = plansQuery.data ?? null;
  const paidPlans =
    catalog?.plans.filter((plan) => plan.kind === "paid") ?? [];
  const promo = catalog?.promo ?? null;

  return (
    <section className="card col-12" aria-labelledby="dev-promocoes-title">
      <DevSectionHeader
        icon="calculator"
        title="Promoções"
        titleId="dev-promocoes-title"
        subtitle="Defina o preço promocional de um plano e a duração. O texto, o percentual e o banner na página de planos são gerados automaticamente, e o preço volta ao normal quando a promoção termina."
      />

      {plansQuery.isLoading ? (
        <p className="dev-empty-state dev-empty-state--compact" role="status">
          Carregando preços…
        </p>
      ) : !catalog ? (
        <p className="dev-empty-state dev-empty-state--compact" role="alert">
          Não foi possível carregar os planos.
        </p>
      ) : (
        <>
          {promo ? (
            <DevActivePromoCard promo={promo} />
          ) : (
            <p className="dev-empty-state dev-empty-state--compact">
              Nenhuma promoção ativa. Crie uma abaixo.
            </p>
          )}

          <div className="dev-promo-block">
            <h3 className="dev-sync-queue-subtitle">Preços atuais</h3>
            <DevPromotionPriceTable plans={catalog.plans} promo={promo} />
          </div>

          <div className="dev-promo-block">
            <h3 className="dev-sync-queue-subtitle">Nova promoção</h3>
            <DevPromotionForm paidPlans={paidPlans} />
          </div>
        </>
      )}
    </section>
  );
}
