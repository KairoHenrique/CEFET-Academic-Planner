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
    title: "Conta pronta",
    body: "O app é gratuito com anúncios. Só pague se quiser remover a propaganda.",
  },
  renew: {
    tone: "renew",
    title: "Renovar remoção de anúncios",
    body: "Escolha um período abaixo e pague pela Google Play.",
  },
  pending: {
    tone: "pending",
    title: "Compra em andamento",
    body: "Conclua na Play Store ou tente novamente.",
  },
};

/** Status do plano sem ads. */
export function PlanosStatusAlert({ flow, account }: Props) {
  if (account?.adsFree?.active) {
    return (
      <View style={[styles.alert, styles.tone_welcome]}>
        <Text style={styles.title}>Sem anúncios</Text>
        <Text style={styles.body}>
          Válido no app e na web
          {account.adsFree.expiresAt
            ? ` até ${new Date(account.adsFree.expiresAt).toLocaleDateString("pt-BR")}.`
            : "."}
        </Text>
      </View>
    );
  }

  if (flow && flow !== "exists") {
    const copy = FLOW_COPY[flow];
    return (
      <View style={[styles.alert, styles[`tone_${copy.tone}`]]}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
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
});
