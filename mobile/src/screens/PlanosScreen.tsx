import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  BillingCheckoutResponse,
  BillingPlansResponse,
  RedeemGiftKeyResponse,
} from "@acme/api-contracts";
import {
  ApiClientError,
  requestJson,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

export function PlanosScreen() {
  const [plans, setPlans] = useState<BillingPlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [payment, setPayment] = useState<
    BillingCheckoutResponse["payment"] | null
  >(null);
  const [giftCode, setGiftCode] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await requestJson<BillingPlansResponse>(
        "/api/billing/plans"
      );
      setPlans(result);
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

  async function startCheckout(planId: string) {
    setCheckoutBusy(planId);
    setMessage(null);
    setPayment(null);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await requestJson<BillingCheckoutResponse>(
        "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ planId, idempotencyKey }),
        }
      );
      setPayment(result.payment);
      setMessage("PIX gerado. Pague e toque em “Já paguei”.");
    } catch (err) {
      setMessage(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao iniciar checkout."
      );
    } finally {
      setCheckoutBusy(null);
    }
  }

  async function confirmPaid() {
    setMessage(null);
    try {
      await syncSubscriptionFromPerfil();
      setMessage("Assinatura atualizada. Se liberou, volte ao Início.");
      setPayment(null);
    } catch (err) {
      setMessage(
        err instanceof ApiClientError
          ? err.message
          : "Ainda não identificamos o pagamento."
      );
    }
  }

  async function redeemGift() {
    const code = giftCode.trim();
    if (!code) {
      setMessage("Informe o código do presente.");
      return;
    }
    setGiftBusy(true);
    setMessage(null);
    try {
      const result = await requestJson<RedeemGiftKeyResponse>(
        "/api/billing/redeem-key",
        {
          method: "POST",
          body: JSON.stringify({ code }),
        }
      );
      await syncSubscriptionFromPerfil();
      setGiftCode("");
      setMessage(`Chave resgatada: ${result.planLabel}. Acesso atualizado.`);
    } catch (err) {
      setMessage(
        err instanceof ApiClientError ? err.message : "Código inválido."
      );
    } finally {
      setGiftBusy(false);
    }
  }

  return (
    <Screen
      title="Planos"
      subtitle="Assine via PIX ou resgate uma chave-presente"
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
    >
      {loading && !plans ? <LoadingBlock /> : null}
      {error && !plans ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {plans?.promo ? (
        <View style={styles.promo}>
          <Text style={styles.promoTitle}>{plans.promo.headline}</Text>
          <Text style={styles.promoBody}>{plans.promo.description}</Text>
        </View>
      ) : null}

      {plans?.plans.length === 0 && !loading ? (
        <EmptyState title="Nenhum plano disponível" />
      ) : null}

      {plans?.plans.map((plan) => (
        <View
          key={plan.id}
          style={[cardStyles.card, plan.featured && styles.featured]}
        >
          <Text style={cardStyles.cardTitle}>{plan.shortLabel}</Text>
          <Text style={styles.price}>{plan.priceLabel}</Text>
          <Text style={cardStyles.cardMeta}>
            {plan.durationLabel} · {plan.description}
          </Text>
          {plans.checkoutEnabled ? (
            <Pressable
              style={[styles.button, checkoutBusy === plan.id && styles.disabled]}
              onPress={() => void startCheckout(plan.id)}
              disabled={!!checkoutBusy}
            >
              {checkoutBusy === plan.id ? (
                <ActivityIndicator color={brand.bg} />
              ) : (
                <Text style={styles.buttonText}>Pagar com PIX</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ))}

      {payment ? (
        <View style={cardStyles.card}>
          <Text style={cardStyles.cardTitle}>Pagamento PIX</Text>
          <Text style={cardStyles.cardMeta}>
            Status: {payment.status} · expira{" "}
            {new Date(payment.expiresAt).toLocaleString("pt-BR")}
          </Text>
          {payment.qrCode ? (
            <Text style={styles.pixCode} selectable>
              {payment.qrCode}
            </Text>
          ) : null}
          <Pressable style={styles.secondary} onPress={() => void confirmPaid()}>
            <Text style={styles.secondaryText}>Já paguei — atualizar</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={cardStyles.sectionTitle}>Chave-presente</Text>
      <View style={cardStyles.card}>
        <TextInput
          style={styles.input}
          placeholder="Código da chave"
          placeholderTextColor={brand.textMuted}
          value={giftCode}
          onChangeText={setGiftCode}
          autoCapitalize="characters"
          editable={!giftBusy}
        />
        <Pressable
          style={[styles.button, giftBusy && styles.disabled]}
          onPress={() => void redeemGift()}
          disabled={giftBusy}
        >
          {giftBusy ? (
            <ActivityIndicator color={brand.bg} />
          ) : (
            <Text style={styles.buttonText}>Resgatar</Text>
          )}
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  promo: {
    backgroundColor: brand.glass,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brand.border,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: brand.gold,
  },
  promoBody: {
    marginTop: 4,
    fontSize: 13,
    color: brand.textMuted,
    lineHeight: 18,
  },
  featured: {
    borderColor: brand.gold,
    borderWidth: 2,
  },
  price: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "800",
    color: brand.gold,
  },
  button: {
    marginTop: 12,
    backgroundColor: brand.gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  secondary: {
    marginTop: 10,
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  buttonText: {
    color: brand.bg,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryText: {
    color: brand.text,
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.glass,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: brand.text,
    marginBottom: 10,
  },
  pixCode: {
    marginTop: 10,
    fontSize: 11,
    color: brand.textSecondary,
    lineHeight: 16,
    fontFamily: "monospace",
  },
  message: {
    marginTop: 12,
    fontSize: 13,
    color: brand.gold,
    textAlign: "center",
    lineHeight: 18,
  },
});
