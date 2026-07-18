import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { subscriptionStatusLabel } from "../auth/access";
import {
  ApiClientError,
  logoutLocal,
  resolveWebHref,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { maskCpf } from "../auth/cpf";
import type { MobileAuthSession } from "../auth/session";
import { brand } from "../theme/brand";

type Props = {
  session: MobileAuthSession;
};

export function PaywallScreen({ session }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sub = session.subscription;
  const planosUrl = resolveWebHref(
    sub.renewHref?.trim() || "/planos?flow=renew"
  );

  async function openPlanos() {
    await Linking.openURL(planosUrl);
  }

  async function onRefresh() {
    setBusy(true);
    setMessage(null);
    try {
      await syncSubscriptionFromPerfil();
      setMessage("Status atualizado. Se liberou, a home abre sozinha.");
    } catch (error) {
      setMessage(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível atualizar."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    try {
      await logoutLocal();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>ACME HUB</Text>
      <Text style={styles.title}>Assinatura necessária</Text>
      <Text style={styles.body}>
        Sua conta ({maskCpf(session.cpf)}) está com acesso bloqueado:{" "}
        {subscriptionStatusLabel(sub.status)}.
      </Text>
      {sub.planLabel ? (
        <Text style={styles.meta}>Plano: {sub.planLabel}</Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={() => void openPlanos()}
          disabled={busy}
        >
          <Text style={styles.buttonText}>Abrir planos no site</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, busy && styles.disabled]}
          onPress={() => void onRefresh()}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={brand.text} />
          ) : (
            <Text style={styles.secondaryText}>Já paguei — atualizar</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.secondary, busy && styles.disabled]}
          onPress={() => void onLogout()}
          disabled={busy}
        >
          <Text style={styles.secondaryText}>Sair</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.hint}>
        Planos/PIX nativos entram em M13. Por enquanto o pagamento é no site.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.bg,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: brand.gold,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  title: {
    marginTop: 16,
    color: brand.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    marginTop: 12,
    color: brand.textSecondary,
    opacity: 0.95,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  meta: {
    marginTop: 8,
    color: brand.gold,
    textAlign: "center",
    fontSize: 14,
  },
  actions: {
    marginTop: 28,
    gap: 10,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  button: {
    backgroundColor: brand.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondary: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.55 },
  buttonText: {
    color: brand.bg,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryText: {
    color: brand.text,
    fontWeight: "700",
    fontSize: 15,
  },
  message: {
    marginTop: 16,
    color: brand.textSecondary,
    textAlign: "center",
    fontSize: 13,
  },
  hint: {
    marginTop: 24,
    color: brand.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
