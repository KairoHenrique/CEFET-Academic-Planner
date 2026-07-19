import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  isPaymentTerminalFailure,
  isPaymentTerminalSuccess,
} from "./planos-utils";
import { brand } from "../../theme/brand";

type Props = {
  status: string;
  expiresAt: string | null | undefined;
};

/** Espelho F28 de `PixPaymentStatusBanner`. */
export function PixPaymentStatusBanner({ status, expiresAt }: Props) {
  if (isPaymentTerminalSuccess(status)) {
    return (
      <View style={[styles.banner, styles.success]}>
        <Text style={styles.title}>Pagamento confirmado</Text>
        <Text style={styles.body}>Liberando seu acesso…</Text>
      </View>
    );
  }

  if (isPaymentTerminalFailure(status)) {
    return (
      <View style={[styles.banner, styles.fail]}>
        <Text style={styles.title}>Pagamento não concluído</Text>
        <Text style={styles.body}>
          Status: {status}. Volte aos planos e gere um novo PIX.
        </Text>
      </View>
    );
  }

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleString("pt-BR")
    : null;

  return (
    <View style={[styles.banner, styles.pending]}>
      <View style={styles.row}>
        <ActivityIndicator color={brand.gold} />
        <Text style={styles.title}>Aguardando pagamento</Text>
      </View>
      <Text style={styles.body}>
        Escaneie o QR ou copie o código. Confirmamos automaticamente.
        {expiresLabel ? ` Expira em ${expiresLabel}.` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  pending: {
    borderColor: "rgba(212,168,67,0.4)",
    backgroundColor: "rgba(212,168,67,0.12)",
  },
  success: {
    borderColor: "rgba(63,185,80,0.4)",
    backgroundColor: "rgba(63,185,80,0.12)",
  },
  fail: {
    borderColor: "rgba(248,81,73,0.4)",
    backgroundColor: "rgba(248,81,73,0.12)",
  },
});
