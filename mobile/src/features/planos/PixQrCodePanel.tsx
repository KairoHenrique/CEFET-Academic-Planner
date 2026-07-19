import { Image, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  qrCodeBase64: string | null | undefined;
  planLabel: string;
  amountLabel: string;
};

/** Espelho F28 de `PixQrCodePanel`. */
export function PixQrCodePanel({
  qrCodeBase64,
  planLabel,
  amountLabel,
}: Props) {
  const uri = qrCodeBase64
    ? qrCodeBase64.startsWith("data:")
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.meta}>
        {planLabel} · {amountLabel}
      </Text>
      {uri ? (
        <Image source={{ uri }} style={styles.qr} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            QR indisponível — use o código copia-e-cola abaixo.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12 },
  meta: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    textAlign: "center",
  },
  qr: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  placeholder: {
    width: 220,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "center",
  },
});
