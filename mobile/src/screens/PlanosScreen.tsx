import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
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
  BillingPlansResponse,
  PaidPlanId,
} from "@acme/api-contracts";
import {
  ApiClientError,
  requestJson,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { getSession } from "../auth/session";
import { GiftKeyRedeemForm } from "../features/planos/GiftKeyRedeemForm";
import { PlanosHero } from "../features/planos/PlanosHero";
import { PlanosStatusAlert } from "../features/planos/PlanosStatusAlert";
import {
  parsePlanosFlow,
  resolvePlanosFlowForStatus,
  type PlanosFlow,
} from "../features/planos/planos-utils";
import { refreshAdsFreeFromServer } from "../ads/refresh-ads-free";
import type { RootStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PlanosRoute = RouteProp<RootStackParamList, "Planos">;

type Props = {
  initialFlow?: PlanosFlow;
  paywall?: boolean;
  onExploreDashboard?: () => void;
  footerExtra?: ReactNode;
};

type IapModule = {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  getSubscriptions: (skus: string[]) => Promise<Array<{ productId: string }>>;
  requestSubscription: (sku: string) => Promise<{
    productId?: string;
    purchaseToken?: string;
    transactionReceipt?: string;
  } | Array<{ productId?: string; purchaseToken?: string }>>;
  finishTransaction: (
    purchase: { productId?: string; purchaseToken?: string },
    isConsumable?: boolean
  ) => Promise<void>;
};

function loadIap(): IapModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-iap") as IapModule;
  } catch {
    return null;
  }
}

/**
 * Remover anuncios — somente Google Play no APK (sem PIX / Mercado Pago).
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
  const [buying, setBuying] = useState<PaidPlanId | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const session = getSession();
  const subStatus = session?.subscription.status;

  const effectiveFlow = useMemo(() => {
    if (initialFlow) return initialFlow;
    if (routeFlow) return routeFlow;
    return subStatus ? resolvePlanosFlowForStatus(subStatus) : null;
  }, [initialFlow, routeFlow, subStatus]);

  const adsFreeActive = Boolean(account?.adsFree?.active);

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
      if (billing?.adsFree) {
        await refreshAdsFreeFromServer();
      }
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

  const purchasable = useMemo(() => {
    if (!catalog) return [];
    return (catalog.plans ?? []).filter(
      (p) => p.kind === "paid" && p.purchasable && (p.id === "month" || p.id === "year")
    );
  }, [catalog]);

  async function handlePlayPurchase(planId: PaidPlanId) {
    setBuyError(null);
    setBuying(planId);
    try {
      const sku = catalog?.playPrices?.[planId]?.sku;
      if (!sku) {
        throw new Error("SKU Play não configurado para este plano.");
      }

      const iap = loadIap();
      if (!iap) {
        Alert.alert(
          "Play Billing",
          "Compras na Play ficam disponíveis no build EAS (não no Expo Go). Enquanto isso, use uma chave gift ou remova anúncios pela web (PIX)."
        );
        return;
      }

      await iap.initConnection();
      try {
        await iap.getSubscriptions([sku]);
        const purchase = await iap.requestSubscription(sku);
        const item = Array.isArray(purchase) ? purchase[0] : purchase;
        const token = item?.purchaseToken;
        const productId = item?.productId ?? sku;
        if (!token) {
          throw new Error("Compra cancelada ou sem token.");
        }

        await requestJson("/api/billing/play/verify", {
          method: "POST",
          body: JSON.stringify({ productId, purchaseToken: token }),
        });
        await iap.finishTransaction(item, false);
        await refreshAdsFreeFromServer();
        await syncSubscriptionFromPerfil().catch(() => undefined);
        await load();
        Alert.alert("Pronto", "Anúncios removidos neste aparelho e na web.");
      } finally {
        await iap.endConnection().catch(() => undefined);
      }
    } catch (err) {
      setBuyError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Não foi possível concluir a compra."
      );
    } finally {
      setBuying(null);
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
        subtitle={
          adsFreeActive
            ? "Você está sem anúncios neste aparelho e na web."
            : "App gratuito com anúncios. Pague só se quiser remover a propaganda — via Google Play."
        }
        showExploreLink={Boolean(onExploreDashboard) || effectiveFlow === "welcome"}
        onExplore={
          onExploreDashboard ??
          (() => navigation.navigate("Dashboard"))
        }
      />

      {account ? (
        <PlanosStatusAlert flow={effectiveFlow} account={account} />
      ) : null}

      {loading && !catalog ? <LoadingBlock /> : null}
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}

      {buyError ? <Text style={styles.error}>{buyError}</Text> : null}

      <View style={styles.list}>
        {purchasable.map((plan) => {
          const play = catalog?.playPrices?.[plan.id as PaidPlanId];
          const priceLabel = play?.priceLabel ?? plan.priceLabel;
          return (
            <View key={plan.id} style={styles.card}>
              <Text style={styles.cardTitle}>{plan.label}</Text>
              <Text style={styles.cardPrice}>{priceLabel}</Text>
              <Text style={styles.cardDesc}>{plan.description}</Text>
              <Pressable
                style={[styles.cta, (buying || adsFreeActive) && styles.ctaDisabled]}
                disabled={Boolean(buying) || adsFreeActive}
                onPress={() => void handlePlayPurchase(plan.id as PaidPlanId)}
              >
                <Text style={styles.ctaText}>
                  {adsFreeActive
                    ? "Já sem anúncios"
                    : buying === plan.id
                      ? "Abrindo Play…"
                      : "Comprar na Play"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.note}>
        Pagamento somente pela Google Play neste app. PIX fica exclusivo da versão web.
        O benefício vale nos dois.
      </Text>

      <GiftKeyRedeemForm
        onSuccess={() => {
          void refreshAdsFreeFromServer();
          void load();
        }}
      />

      {footerExtra}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusLg,
    padding: 16,
    backgroundColor: brand.glass,
    gap: 8,
  },
  cardTitle: {
    color: brand.text,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 16,
  },
  cardPrice: {
    color: brand.gold,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    fontSize: 22,
  },
  cardDesc: {
    color: brand.textMuted,
    fontFamily: brand.fontBody,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    marginTop: 8,
    minHeight: brand.touchMin,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: {
    color: brand.text,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  note: {
    marginTop: 16,
    marginBottom: 12,
    color: brand.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: brand.fontBody,
  },
  error: {
    color: brand.danger,
    marginBottom: 8,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
});
