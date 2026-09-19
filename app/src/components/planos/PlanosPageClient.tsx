"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GiftKeyRedeemForm } from "@/components/billing/GiftKeyRedeemForm";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { PlanosCheckoutPanel } from "@/components/planos/PlanosCheckoutPanel";
import { PlanosHero } from "@/components/planos/PlanosHero";
import { PlanosPageShell } from "@/components/planos/PlanosPageShell";
import { PlanosPromoBanner } from "@/components/planos/PlanosPromoBanner";
import { PlanosStatusAlert } from "@/components/planos/PlanosStatusAlert";
import { PlannerNotice } from "@/components/ui/PlannerNotice";
import { useBillingAccount } from "@/hooks/useBillingAccount";
import { useBillingPlans } from "@/hooks/useBillingPlans";
import { usePerfil } from "@/hooks/usePerfil";
import { ApiClientError, postBillingCheckout } from "@/lib/api/client";
import { isSubscriptionBlocked } from "@/lib/billing/access/subscription-access-rules";
import { savePendingCheckout } from "@/lib/billing/pending-checkout-storage";
import {
  resolvePlanosFlowForStatus,
  type PlanosFlow,
} from "@/lib/billing/subscription-access-client";
import type { PaidPlanId } from "@/lib/types/billing-api";

function parsePlanosFlow(value: string | null): PlanosFlow | null {
  if (
    value === "welcome" ||
    value === "renew" ||
    value === "pending" ||
    value === "exists"
  ) {
    return value;
  }

  return null;
}

export function PlanosPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFlow = parsePlanosFlow(searchParams.get("flow"));
  const { data: perfil } = usePerfil();
  const { data: billingAccount } = useBillingAccount();
  const { data: catalog, isLoading, error } = useBillingPlans();
  const [selectingPlanId, setSelectingPlanId] = useState<PaidPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutEpoch, setCheckoutEpoch] = useState(0);

  const effectiveFlow = useMemo(() => {
    if (queryFlow) {
      return queryFlow;
    }

    const status = perfil?.subscription.status;
    return status ? resolvePlanosFlowForStatus(status) : null;
  }, [perfil?.subscription.status, queryFlow]);

  const showExploreLink =
    effectiveFlow === "welcome" ||
    (perfil?.subscription.status === "trial_active");

  const subtitle = catalog?.checkoutEnabled
    ? "O ACME é gratuito. Pague só se quiser remover anúncios no app e na web (PIX)."
    : "Checkout PIX em configuração — valores abaixo são referência.";

  const handleCheckout = async (planId: PaidPlanId) => {
    setCheckoutError(null);
    setSelectingPlanId(planId);

    try {
      const result = await postBillingCheckout({ planId });
      savePendingCheckout(result);
      router.push(`/planos/pix?paymentId=${encodeURIComponent(result.payment.id)}`);
    } catch (caught) {
      setCheckoutEpoch((value) => value + 1);
      setCheckoutError(
        caught instanceof ApiClientError
          ? caught.message
          : "Não foi possível iniciar o checkout. Tente novamente."
      );
    } finally {
      setSelectingPlanId(null);
    }
  };

  const showDashboardLink =
    perfil?.subscription.status != null &&
    !isSubscriptionBlocked(perfil.subscription.status);

  return (
    <PlanosPageShell>
      <PlanosHero subtitle={subtitle} showExploreLink={showExploreLink} />

      {catalog?.promo ? <PlanosPromoBanner promo={catalog.promo} /> : null}

      <PlanosStatusAlert flow={effectiveFlow} account={billingAccount} />

      {isLoading ? (
        <p className="planos-loading" role="status">
          Carregando planos…
        </p>
      ) : null}

      {error ? (
        <p className="planos-error" role="alert">
          Não foi possível carregar os planos. Atualize a página.
        </p>
      ) : null}

      {catalog ? (
        <PlanosCheckoutPanel
          catalog={catalog}
          selectingPlanId={selectingPlanId}
          onCheckout={(planId) => void handleCheckout(planId)}
        />
      ) : null}

      <footer className="planos-footer">
        <LegalFooterLinks className="planos-legal-links" />
        <GiftKeyRedeemForm variant="compact" />
        {showDashboardLink ? (
          <p className="planos-back">
            <Link href="/">← Voltar ao dashboard</Link>
          </p>
        ) : null}
      </footer>

      <PlannerNotice
        open={Boolean(checkoutError)}
        message={checkoutError}
        noticeKey={checkoutEpoch}
        kicker="Checkout indisponível"
        onDismiss={() => setCheckoutError(null)}
      />
    </PlanosPageShell>
  );
}
