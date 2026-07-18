import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { subscriptionStatusLabel } from "../auth/access";
import {
  ApiClientError,
  logoutLocal,
  syncSubscriptionFromPerfil,
} from "../auth/api";
import { maskCpf } from "../auth/cpf";
import type { MobileAuthSession } from "../auth/session";
import { brand } from "../theme/brand";

type Props = {
  session: MobileAuthSession;
};

/**
 * Placeholder até M7 (dashboard). Confirma gate + logout.
 */
export function HomePlaceholderScreen({ session }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sub = session.subscription;

  async function onRefreshAccess() {
    setBusy(true);
    setMessage(null);
    try {
      await syncSubscriptionFromPerfil();
      setMessage("Acesso atualizado.");
    } catch (error) {
      setMessage(
        error instanceof ApiClientError
          ? error.message
          : "Falha ao atualizar assinatura."
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
      <Text style={styles.subtitle}>Olá · acesso liberado</Text>
      <Text style={styles.status}>
        CPF {maskCpf(session.cpf)} · {subscriptionStatusLabel(sub.status)}
      </Text>
      {sub.planLabel ? (
        <Text style={styles.meta}>
          {sub.planLabel}
          {sub.daysRemaining > 0 ? ` · ${sub.daysRemaining}d` : ""}
        </Text>
      ) : null}

      <Text style={styles.placeholder}>
        Telas do app (dashboard, matérias, …) entram em M7+. Navegação será
        bottom tabs — sem sidebar.
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={() => void onRefreshAccess()}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={brand.blue} />
          ) : (
            <Text style={styles.buttonText}>Atualizar assinatura</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.blue,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: brand.white,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: brand.gold,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  status: {
    marginTop: 16,
    color: brand.white,
    textAlign: "center",
    fontSize: 14,
  },
  meta: {
    marginTop: 6,
    color: brand.white,
    opacity: 0.85,
    textAlign: "center",
    fontSize: 13,
  },
  placeholder: {
    marginTop: 28,
    color: brand.white,
    opacity: 0.8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
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
    minHeight: 48,
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  buttonText: {
    color: brand.blue,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryText: {
    color: brand.white,
    fontWeight: "700",
    fontSize: 15,
  },
  message: {
    marginTop: 16,
    color: brand.white,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.9,
  },
});
