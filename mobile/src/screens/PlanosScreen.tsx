import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  BillingAccountResponse,
  BillingCheckoutResponse,
  BillingPlansResponse,
  PaidPlanId,
} from "@acme/api-contracts";
import {
  ApiClientError,
  requestJson,
  resolveWebHref,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { isSubscriptionBlocked } from "../auth/access";
import { getSession } from "../auth/session";
import { GiftKeyRedeemForm } from "../features/planos/GiftKeyRedeemForm";
import { PlanosCheckoutPanel } from "../features/planos/PlanosCheckoutPanel";
import { PlanosHero } from "../features/planos/PlanosHero";
import { PlanosPromoBanner } from "../features/planos/PlanosPromoBanner";
import { PlanosStatusAlert } from "../features/planos/PlanosStatusAlert";
import { savePendingCheckout } from "../features/planos/pending-checkout-storage";
import {
  parsePlanosFlow,
  resolvePlanosFlowForStatus,
  type PlanosFlow,
} from "../features/planos/planos-utils";
import type { RootStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PlanosRoute = RouteProp<RootStackParamList, "Planos">;

type Props = {
  /** Paywall standalone (sem rota). */
  initialFlow?: PlanosFlow;
  paywall?: boolean;
  onExploreDashboard?: () => void;
  footerExtra?: ReactNode;
};

/**
 * Planos F28 — ordem do site:
 * hero → promo → status → picker+showcase → legal + gift → voltar
 */
export function PlanosScreen({
  initialFlow,
  paywall = false,
  onExploreDashboard,
  footerExtra,
}: Props = {}) {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PlanosRoute>();
  const routeFlow = parsePlanosFlow(route.params?.flow ?? null);
  const isPaywall = paywall || Boolean(route.params?.paywall);

  const [catalog, setCatalog] = useState<BillingPlansResponse | null>(null);
  const [account, setAccount] = useState<BillingAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingPlanId, setSelectingPlanId] = useState<PaidPlanId | null>(
    null
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const session = getSession();
  const subStatus = session?.subscription.status;

  const effectiveFlow = useMemo(() => {
    if (initialFlow) return initialFlow;
    if (routeFlow) return routeFlow;
    return subStatus ? resolvePlanosFlowForStatus(subStatus) : null;
  }, [initialFlow, routeFlow, subStatus]);

  const showExploreLink =
    !isPaywall &&
    (effectiveFlow === "welcome" || subStatus === "trial_active");

  const showDashboardLink =
    !isPaywall &&
    subStatus != null &&
    !isSubscriptionBlocked(subStatus);

  const subtitle = catalog?.checkoutEnabled
    ? "Um plano, um clique, acesso completo ao ACME."
    : "Checkout PIX em configuração — valores abaixo são referência.";

  const load = useCallback(async () => {
    setError(null);
    try {
      const [plans, billing] = await Promise.all([
        requestJson<BillingPlansResponse>("/api/billing/plans"),
        requestJson<BillingAccountResponse>("/api/billing/account").catch(
          () => null
        ),
      ]);
      setCatalog(plans);
      setAccount(billing);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar os planos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  async function handleCheckout(planId: PaidPlanId) {
    setCheckoutError(null);
    setSelectingPlanId(planId);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const result = await requestJson<BillingCheckoutResponse>(
        "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ planId, idempotencyKey }),
        }
      );
      await savePendingCheckout(result);
      navigation.navigate("PlanosPix", {
        paymentId: result.payment.id,
        paywall: isPaywall || undefined,
      });
    } catch (err) {
      setCheckoutError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível iniciar o checkout. Tente novamente."
      );
    } finally {
      setSelectingPlanId(null);
    }
  }

  return (
    <Screen
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={brand.gold}
          />
        ),
      }}
      safeEdges={isPaywall ? ["top", "left", "right", "bottom"] : undefined}
    >
      <PlanosHero
        subtitle={subtitle}
        showExploreLink={showExploreLink}
        onExplore={
          onExploreDashboard ??
          (() => navigation.navigate("Dashboard"))
        }
      />

      {loading && !catalog ? <LoadingBlock /> : null}
      {error && !catalog ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {catalog?.promo ? <PlanosPromoBanner promo={catalog.promo} /> : null}

      <PlanosStatusAlert flow={effectiveFlow} account={account} />

      {catalog ? (
        <PlanosCheckoutPanel
          catalog={catalog}
          selectingPlanId={selectingPlanId}
          onCheckout={(planId) => void handleCheckout(planId)}
        />
      ) : null}

      {checkoutError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeKicker}>Checkout indisponível</Text>
          <Text style={styles.noticeBody}>{checkoutError}</Text>
          <Pressable onPress={() => setCheckoutError(null)}>
            <Text style={styles.noticeDismiss}>Fechar</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.legal}>
          <Pressable
            onPress={() => void Linking.openURL(resolveWebHref("/termos"))}
          >
            <Text style={styles.legalLink}>Termos</Text>
          </Pressable>
          <Text style={styles.legalSep}>·</Text>
          <Pressable
            onPress={() =>
              void Linking.openURL(resolveWebHref("/privacidade"))
            }
          >
            <Text style={styles.legalLink}>Privacidade</Text>
          </Pressable>
        </View>

        <GiftKeyRedeemForm
          onSuccess={() => {
            void syncSubscriptionFromPerfil();
          }}
        />

        {showDashboardLink ? (
          <Pressable onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.back}>← Voltar ao dashboard</Text>
          </Pressable>
        ) : null}

        {footerExtra}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 20, gap: 12, paddingBottom: 8 },
  legal: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  legalLink: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  legalSep: { color: brand.textMuted },
  back: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  notice: {
    marginTop: 12,
    padding: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.12)",
    gap: 4,
  },
  noticeKicker: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#FF7B72",
    textTransform: "uppercase",
  },
  noticeBody: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  noticeDismiss: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
});
