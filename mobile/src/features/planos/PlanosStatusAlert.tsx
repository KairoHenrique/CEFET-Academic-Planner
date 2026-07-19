import { StyleSheet, Text, View } from "react-native";
import type { BillingAccountResponse } from "@acme/api-contracts";
import type { PlanosFlow } from "./planos-utils";
import { brand } from "../../theme/brand";

type Props = {
  flow: PlanosFlow | null;
  account: BillingAccountResponse | null;
};

const FLOW_COPY: Record<
  Exclude<PlanosFlow, "exists">,
  { title: string; body: string; tone: "welcome" | "renew" | "pending" }
> = {
  welcome: {
    tone: "welcome",
    title: "Conta criada",
    body: "Seu trial de 7 dias já está ativo. Assine quando quiser garantir acesso contínuo.",
  },
  renew: {
    tone: "renew",
    title: "Assinatura necessária",
    body: "Escolha um período abaixo e pague via PIX para voltar ao ACME.",
  },
  pending: {
    tone: "pending",
    title: "PIX pendente",
    body: "Conclua o pagamento em andamento ou escolha um novo plano.",
  },
};

/** Espelho F28 de `PlanosStatusAlert`. */
export function PlanosStatusAlert({ flow, account }: Props) {
  if (flow && flow !== "exists") {
    const copy = FLOW_COPY[flow];
    return (
      <View style={[styles.alert, styles[`tone_${copy.tone}`]]}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
    );
  }

  const subscription = account?.subscription;
  if (!subscription) return null;

  if (subscription.inGracePeriod) {
    return (
      <View style={[styles.alert, styles.tone_grace]}>
        <Text style={styles.title}>Período de tolerância</Text>
        <Text style={styles.body}>
          Você ainda tem {subscription.daysRemaining ?? 0} dia(s) para renovar.
          O novo período será somado ao saldo restante.
        </Text>
      </View>
    );
  }

  if (
    subscription.status === "expired" ||
    subscription.status === "trial_expired"
  ) {
    return (
      <View style={[styles.alert, styles.tone_renew]}>
        <Text style={styles.title}>Renovar assinatura</Text>
        <Text style={styles.body}>
          {subscription.renewalEligible
            ? "Dias restantes do ciclo anterior serão acumulados ao renovar."
            : "Seu acesso expirou. Escolha um plano para continuar."}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  alert: {
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  body: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 17,
  },
  tone_welcome: {
    borderColor: "rgba(63,185,80,0.4)",
    backgroundColor: "rgba(63,185,80,0.12)",
  },
  tone_renew: {
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.12)",
  },
  tone_pending: {
    borderColor: "rgba(212,168,67,0.4)",
    backgroundColor: "rgba(212,168,67,0.12)",
  },
  tone_grace: {
    borderColor: "rgba(56,139,253,0.4)",
    backgroundColor: "rgba(56,139,253,0.12)",
  },
});
