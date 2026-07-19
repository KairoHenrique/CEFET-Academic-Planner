import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BillingPaymentStatusResponse } from "@acme/api-contracts";
import {
  ApiClientError,
  requestJson,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { PixCopyCodeField } from "../features/planos/PixCopyCodeField";
import { PixPaymentStatusBanner } from "../features/planos/PixPaymentStatusBanner";
import { PixQrCodePanel } from "../features/planos/PixQrCodePanel";
import {
  clearPendingCheckout,
  readPendingCheckout,
} from "../features/planos/pending-checkout-storage";
import {
  isPaymentAwaitingConfirmation,
  isPaymentTerminalFailure,
  isPaymentTerminalSuccess,
  resolvePriceLabel,
} from "../features/planos/planos-utils";
import type { RootStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PixRoute = RouteProp<RootStackParamList, "PlanosPix">;

type LocalPayment = {
  id: string;
  planId: string;
  planLabel: string;
  amountCents: number;
  status: string;
  expiresAt: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  ticketUrl?: string | null;
};

const POLL_MS = 4000;

/** Espelho F28 de `PlanosPixScreen` — QR + poll 4s. */
export function PlanosPixScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PixRoute>();
  const paymentId = route.params?.paymentId ?? null;
  const isPaywall = Boolean(route.params?.paywall);

  const [localPayment, setLocalPayment] = useState<LocalPayment | null>(null);
  const [remotePayment, setRemotePayment] = useState<LocalPayment | null>(null);
  const [ready, setReady] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const checkout = await readPendingCheckout(paymentId);
      if (cancelled) return;
      if (checkout) {
        setLocalPayment({
          id: checkout.payment.id,
          planId: checkout.payment.planId,
          planLabel: checkout.payment.planId,
          amountCents: checkout.payment.amountCents,
          status: checkout.payment.status,
          expiresAt: checkout.payment.expiresAt,
          qrCode: checkout.payment.qrCode,
          qrCodeBase64: checkout.payment.qrCodeBase64,
          ticketUrl: checkout.payment.ticketUrl,
        });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const payment = useMemo(
    () => remotePayment ?? localPayment,
    [remotePayment, localPayment]
  );

  const poll = useCallback(async () => {
    if (!paymentId) return;
    try {
      const result = await requestJson<BillingPaymentStatusResponse>(
        `/api/billing/payments/${encodeURIComponent(paymentId)}`
      );
      setRemotePayment({
        id: result.payment.id,
        planId: result.payment.planId,
        planLabel: result.payment.planLabel ?? result.payment.planId,
        amountCents: result.payment.amountCents,
        status: result.payment.status,
        expiresAt: result.payment.expiresAt,
        qrCode: result.payment.qrCode,
        qrCodeBase64: result.payment.qrCodeBase64,
        ticketUrl: result.payment.ticketUrl,
      });
      setPollError(null);
    } catch (err) {
      setPollError(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao consultar pagamento."
      );
    }
  }, [paymentId]);

  useEffect(() => {
    if (!ready || !paymentId) return;
    void poll();
    const status = payment?.status;
    if (
      status &&
      (isPaymentTerminalSuccess(status) ||
        isPaymentTerminalFailure(status) ||
        !isPaymentAwaitingConfirmation(status))
    ) {
      return;
    }
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [ready, paymentId, payment?.status, poll]);

  useEffect(() => {
    if (!payment || !isPaymentTerminalSuccess(payment.status)) return;
    void (async () => {
      await clearPendingCheckout();
      await syncSubscriptionFromPerfil();
      if (!isPaywall) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        });
      }
      // Paywall: App.tsx troca automaticamente para home ao sync da sessão.
    })();
  }, [payment, isPaywall, navigation]);

  function goBackToPlanos() {
    navigation.navigate("Planos", {
      flow: "pending",
      paywall: isPaywall || undefined,
    });
  }

  if (!ready) {
    return (
      <Screen
        eyebrow="Assinatura"
        title="Pagamento PIX"
        safeEdges={isPaywall ? ["top", "left", "right", "bottom"] : undefined}
      >
        <LoadingBlock />
      </Screen>
    );
  }

  if (!paymentId || !payment) {
    return (
      <Screen
        eyebrow="Assinatura"
        title="Pagamento PIX"
        subtitle="Não encontramos um checkout ativo nesta sessão."
        safeEdges={isPaywall ? ["top", "left", "right", "bottom"] : undefined}
      >
        <Pressable onPress={goBackToPlanos}>
          <Text style={styles.back}>← Voltar aos planos</Text>
        </Pressable>
      </Screen>
    );
  }

  const amountLabel = resolvePriceLabel(payment.amountCents);
  const showPixFields =
    payment.status === "pending" && !isPaymentTerminalFailure(payment.status);

  return (
    <Screen
      eyebrow="Assinatura"
      title="Pagamento PIX"
      subtitle="Escaneie o QR Code ou copie o código no app do banco."
      safeEdges={isPaywall ? ["top", "left", "right", "bottom"] : undefined}
    >
      <PixPaymentStatusBanner
        status={payment.status}
        expiresAt={payment.expiresAt}
      />

      {showPixFields ? (
        <View style={styles.card}>
          <PixQrCodePanel
            qrCodeBase64={payment.qrCodeBase64}
            planLabel={payment.planLabel}
            amountLabel={amountLabel}
          />
          {payment.qrCode ? (
            <PixCopyCodeField qrCode={payment.qrCode} />
          ) : null}
          {payment.ticketUrl ? (
            <Pressable
              onPress={() => void Linking.openURL(payment.ticketUrl!)}
            >
              <Text style={styles.ticket}>Abrir comprovante no gateway</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {pollError ? <Text style={styles.pollError}>{pollError}</Text> : null}

      <Pressable onPress={goBackToPlanos}>
        <Text style={styles.back}>← Voltar aos planos</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    padding: 16,
    marginBottom: 16,
  },
  back: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  ticket: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  pollError: {
    marginBottom: 8,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: "#FF7B72",
    textAlign: "center",
  },
});
